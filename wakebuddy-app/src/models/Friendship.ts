export type Friendship = {
  friendshipId: string;

  // 친구 관계에 포함된 두 사용자 uid
  userIds: string[];

  // 친구 관계를 만든 사용자 uid
  createdBy: string;

  createdAt: Date;
};