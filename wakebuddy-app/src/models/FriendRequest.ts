export type FriendRequestStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "canceled";

export type FriendRequest = {
  requestId: string;

  // 친구 요청을 보낸 사용자 uid
  senderId: string;

  // 친구 요청을 받은 사용자 uid
  receiverId: string;

  // 요청 상태
  status: FriendRequestStatus;

  createdAt: Date;
  updatedAt: Date;
};