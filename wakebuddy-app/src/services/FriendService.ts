import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { Friendship } from "../models/Friendship";
import { User } from "../models/User";

const USERS_COLLECTION = "users";
const FRIENDSHIPS_COLLECTION = "friendships";

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
 * Firestore users 컬렉션 문서를 앱의 User 타입으로 변환한다.
 */
function mapUserDocument(uid: string, data: any): User {
  return {
    uid,
    email: data.email ?? "",
    displayName: data.displayName ?? "",
    createdAt: toDate(data.createdAt),
  };
}

/**
 * Firestore friendships 컬렉션 문서를 앱의 Friendship 타입으로 변환한다.
 */
function mapFriendshipDocument(friendshipId: string, data: any): Friendship {
  return {
    friendshipId,
    userIds: data.userIds ?? [],
    createdBy: data.createdBy ?? "",
    createdAt: toDate(data.createdAt),
  };
}

export const FriendService = {
  /**
   * 친구 목록 조회
   *
   * friendships 컬렉션에서 userIds 배열에 현재 사용자 uid가 포함된 문서를 조회한다.
   * 그 후 userIds 배열에서 현재 사용자가 아닌 uid를 찾아 users 컬렉션에서 친구 정보를 불러온다.
   */
  async getFriends(userId: string): Promise<User[]> {
    if (!userId) {
      throw new Error("사용자 정보가 없습니다.");
    }

    const friendshipQuery = query(
      collection(db, FRIENDSHIPS_COLLECTION),
      where("userIds", "array-contains", userId),
    );

    const snapshot = await getDocs(friendshipQuery);

    const friendships = snapshot.docs.map((friendshipDoc) =>
      mapFriendshipDocument(friendshipDoc.id, friendshipDoc.data()),
    );

    const friends: User[] = [];

    for (const friendship of friendships) {
      const friendId = friendship.userIds.find((id) => id !== userId);

      if (!friendId) {
        continue;
      }

      const friendDoc = await getDoc(doc(db, USERS_COLLECTION, friendId));

      if (friendDoc.exists()) {
        friends.push(mapUserDocument(friendDoc.id, friendDoc.data()));
      }
    }

    return friends;
  },

  /**
   * 친구 여부 확인
   *
   * 현재 사용자와 대상 사용자가 friendships 컬렉션에 친구 관계로 저장되어 있는지 확인한다.
   */
  async isFriend(userId: string, friendId: string): Promise<boolean> {
    if (!userId || !friendId) {
      return false;
    }

    const friendshipQuery = query(
      collection(db, FRIENDSHIPS_COLLECTION),
      where("userIds", "array-contains", userId),
    );

    const snapshot = await getDocs(friendshipQuery);

    return snapshot.docs.some((friendshipDoc) => {
      const data = friendshipDoc.data();
      const userIds = data.userIds ?? [];

      return userIds.includes(friendId);
    });
  },

  /**
   * 친구 삭제
   *
   * 현재 사용자와 friendId가 함께 포함된 friendship 문서를 찾아 삭제한다.
   */
  async removeFriend(userId: string, friendId: string): Promise<void> {
    if (!userId) {
      throw new Error("사용자 정보가 없습니다.");
    }

    if (!friendId) {
      throw new Error("삭제할 친구 정보가 없습니다.");
    }

    const friendshipQuery = query(
      collection(db, FRIENDSHIPS_COLLECTION),
      where("userIds", "array-contains", userId),
    );

    const snapshot = await getDocs(friendshipQuery);

    const targetDoc = snapshot.docs.find((friendshipDoc) => {
      const data = friendshipDoc.data();
      const userIds = data.userIds ?? [];

      return userIds.includes(friendId);
    });

    if (!targetDoc) {
      throw new Error("친구 관계를 찾을 수 없습니다.");
    }

    await deleteDoc(doc(db, FRIENDSHIPS_COLLECTION, targetDoc.id));
  },

  /**
   * 친구 관계 생성
   *
   * 친구 요청을 수락했을 때 FriendRequestService에서 호출한다.
   * 이미 친구 관계가 존재하면 중복 생성하지 않는다.
   */
  async createFriendship(
    userId: string,
    friendId: string,
    createdBy: string,
  ): Promise<void> {
    if (!userId || !friendId) {
      throw new Error("친구 관계를 만들 사용자 정보가 없습니다.");
    }

    const alreadyFriend = await this.isFriend(userId, friendId);

    if (alreadyFriend) {
      return;
    }

    const friendshipRef = doc(collection(db, FRIENDSHIPS_COLLECTION));

    await setDoc(friendshipRef, {
      userIds: [userId, friendId],
      createdBy,
      createdAt: serverTimestamp(),
    });
  },
};