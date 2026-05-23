import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import {
  FriendRequest,
  FriendRequestStatus,
} from "../models/FriendRequest";
import { FriendService } from "./FriendService";

const USERS_COLLECTION = "users";
const FRIEND_REQUESTS_COLLECTION = "friendRequests";

/**
 * Firestore Timestamp 또는 Date 값을 Date 타입으로 변환한다.
 */
function toDate(value: unknown): Date {
  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  return new Date();
}

/**
 * Firestore 문서를 FriendRequest 타입으로 변환한다.
 */
function mapFriendRequestDocument(
  requestId: string,
  data: any,
): FriendRequest {
  return {
    requestId,
    senderId: data.senderId ?? "",
    receiverId: data.receiverId ?? "",
    status: (data.status ?? "pending") as FriendRequestStatus,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

/**
 * 이메일로 사용자 uid를 조회한다.
 */
async function findUserIdByEmail(email: string): Promise<string | null> {
  const userQuery = query(
    collection(db, USERS_COLLECTION),
    where("email", "==", email),
  );

  const snapshot = await getDocs(userQuery);

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].id;
}

/**
 * 두 사용자 사이에 대기 중인 친구 요청이 있는지 확인한다.
 */
async function hasPendingRequest(
  senderId: string,
  receiverId: string,
): Promise<boolean> {
  const sentQuery = query(
    collection(db, FRIEND_REQUESTS_COLLECTION),
    where("senderId", "==", senderId),
  );

  const snapshot = await getDocs(sentQuery);

  return snapshot.docs.some((requestDoc) => {
    const data = requestDoc.data();

    return data.receiverId === receiverId && data.status === "pending";
  });
}

/**
 * 상대방이 나에게 이미 대기 중인 요청을 보냈는지 확인한다.
 */
async function hasReversePendingRequest(
  senderId: string,
  receiverId: string,
): Promise<boolean> {
  const receivedQuery = query(
    collection(db, FRIEND_REQUESTS_COLLECTION),
    where("senderId", "==", receiverId),
  );

  const snapshot = await getDocs(receivedQuery);

  return snapshot.docs.some((requestDoc) => {
    const data = requestDoc.data();

    return data.receiverId === senderId && data.status === "pending";
  });
}

export const FriendRequestService = {
  /**
   * 친구 요청 보내기
   *
   * 친구 이메일로 사용자를 찾고,
   * 아직 친구가 아니며 대기 중 요청이 없을 때 friendRequests에 pending 요청을 생성한다.
   */
  async sendFriendRequest(
    senderId: string,
    receiverEmail: string,
  ): Promise<FriendRequest> {
    if (!senderId) {
      throw new Error("로그인 정보가 없습니다.");
    }

    if (!receiverEmail.trim()) {
      throw new Error("친구 이메일을 입력해주세요.");
    }

    const receiverId = await findUserIdByEmail(receiverEmail.trim());

    if (!receiverId) {
      throw new Error("해당 이메일의 사용자를 찾을 수 없습니다.");
    }

    if (senderId === receiverId) {
      throw new Error("자기 자신에게 친구 요청을 보낼 수 없습니다.");
    }

    const alreadyFriend = await FriendService.isFriend(senderId, receiverId);

    if (alreadyFriend) {
      throw new Error("이미 친구로 등록된 사용자입니다.");
    }

    const alreadySent = await hasPendingRequest(senderId, receiverId);

    if (alreadySent) {
      throw new Error("이미 보낸 친구 요청이 있습니다.");
    }

    const reversePending = await hasReversePendingRequest(senderId, receiverId);

    if (reversePending) {
      throw new Error("상대방이 이미 보낸 친구 요청이 있습니다. 수신함을 확인해주세요.");
    }

    const requestRef = doc(collection(db, FRIEND_REQUESTS_COLLECTION));

    const requestData = {
      senderId,
      receiverId,
      status: "pending" as FriendRequestStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(requestRef, requestData);

    return {
      requestId: requestRef.id,
      senderId,
      receiverId,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  /**
   * 보낸 친구 요청 조회
   */
  async getSentRequests(userId: string): Promise<FriendRequest[]> {
    if (!userId) {
      throw new Error("사용자 정보가 없습니다.");
    }

    const requestQuery = query(
      collection(db, FRIEND_REQUESTS_COLLECTION),
      where("senderId", "==", userId),
    );

    const snapshot = await getDocs(requestQuery);

    return snapshot.docs
      .map((requestDoc) =>
        mapFriendRequestDocument(requestDoc.id, requestDoc.data()),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  /**
   * 받은 친구 요청 조회
   */
  async getReceivedRequests(userId: string): Promise<FriendRequest[]> {
    if (!userId) {
      throw new Error("사용자 정보가 없습니다.");
    }

    const requestQuery = query(
      collection(db, FRIEND_REQUESTS_COLLECTION),
      where("receiverId", "==", userId),
    );

    const snapshot = await getDocs(requestQuery);

    return snapshot.docs
      .map((requestDoc) =>
        mapFriendRequestDocument(requestDoc.id, requestDoc.data()),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  /**
   * 친구 요청 취소
   *
   * 요청을 보낸 사람만 pending 요청을 취소할 수 있다.
   */
  async cancelFriendRequest(
    requestId: string,
    senderId: string,
  ): Promise<void> {
    const requestRef = doc(db, FRIEND_REQUESTS_COLLECTION, requestId);
    const requestDoc = await getDoc(requestRef);

    if (!requestDoc.exists()) {
      throw new Error("친구 요청을 찾을 수 없습니다.");
    }

    const request = mapFriendRequestDocument(requestDoc.id, requestDoc.data());

    if (request.senderId !== senderId) {
      throw new Error("친구 요청을 취소할 권한이 없습니다.");
    }

    if (request.status !== "pending") {
      throw new Error("대기 중인 요청만 취소할 수 있습니다.");
    }

    await updateDoc(requestRef, {
      status: "canceled",
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * 친구 요청 수락
   *
   * 요청을 받은 사람만 수락할 수 있다.
   * 수락 시 friendRequests 상태를 accepted로 바꾸고 friendships 문서를 생성한다.
   */
  async acceptFriendRequest(
    requestId: string,
    receiverId: string,
  ): Promise<void> {
    const requestRef = doc(db, FRIEND_REQUESTS_COLLECTION, requestId);
    const requestDoc = await getDoc(requestRef);

    if (!requestDoc.exists()) {
      throw new Error("친구 요청을 찾을 수 없습니다.");
    }

    const request = mapFriendRequestDocument(requestDoc.id, requestDoc.data());

    if (request.receiverId !== receiverId) {
      throw new Error("친구 요청을 수락할 권한이 없습니다.");
    }

    if (request.status !== "pending") {
      throw new Error("대기 중인 요청만 수락할 수 있습니다.");
    }

    await updateDoc(requestRef, {
      status: "accepted",
      updatedAt: serverTimestamp(),
    });

    await FriendService.createFriendship(
      request.senderId,
      request.receiverId,
      receiverId,
    );
  },

  /**
   * 친구 요청 거절
   *
   * 요청을 받은 사람만 거절할 수 있다.
   */
  async rejectFriendRequest(
    requestId: string,
    receiverId: string,
  ): Promise<void> {
    const requestRef = doc(db, FRIEND_REQUESTS_COLLECTION, requestId);
    const requestDoc = await getDoc(requestRef);

    if (!requestDoc.exists()) {
      throw new Error("친구 요청을 찾을 수 없습니다.");
    }

    const request = mapFriendRequestDocument(requestDoc.id, requestDoc.data());

    if (request.receiverId !== receiverId) {
      throw new Error("친구 요청을 거절할 권한이 없습니다.");
    }

    if (request.status !== "pending") {
      throw new Error("대기 중인 요청만 거절할 수 있습니다.");
    }

    await updateDoc(requestRef, {
      status: "rejected",
      updatedAt: serverTimestamp(),
    });
  },
};