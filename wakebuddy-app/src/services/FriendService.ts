import { Friendship } from "../models/Friendship";
import { User } from "../models/User";

// 임시 데이터 (Firebase 연동 전)
const mockFriendships: Friendship[] = [];
// Firebase 연동 전 친구 추가 테스트용 임시 사용자 데이터
// Firebase 연동 후에는 Firestore users 컬렉션 조회로 대체 예정
const mockUsers: User[] = [
  {
    uid: "friend-1",
    email: "friend@test.com",
    displayName: "테스트 친구",
    createdAt: new Date(),
  },
];

export const FriendService = {
  // 친구 목록 조회
  async getFriends(userId: string): Promise<User[]> {
    const friendships = mockFriendships.filter((f) => f.userId === userId);

    const friends = friendships
      .map((f) => mockUsers.find((u) => u.uid === f.friendId))
      .filter((u): u is User => u !== undefined);

    return friends;
  },

  // 친구 추가
  async addFriend(userId: string, friendEmail: string): Promise<Friendship> {
    // 친구 이메일로 사용자 찾기
    const friendUser = mockUsers.find((u) => u.email === friendEmail);
    if (!friendUser) {
      throw new Error("해당 이메일의 사용자를 찾을 수 없습니다.");
    }

    // 이미 친구인지 확인
    const already = mockFriendships.find(
      (f) => f.userId === userId && f.friendId === friendUser.uid,
    );
    if (already) {
      throw new Error("이미 친구로 등록된 사용자입니다.");
    }

    const newFriendship: Friendship = {
      friendshipId: Date.now().toString(),
      userId,
      friendId: friendUser.uid,
      createdAt: new Date(),
    };

    mockFriendships.push(newFriendship);
    return newFriendship;
  },

  // 친구 삭제
  async removeFriend(userId: string, friendId: string): Promise<void> {
  const index = mockFriendships.findIndex(
    (f) => f.userId === userId && f.friendId === friendId,
  );

  if (index === -1) {
    throw new Error("친구 관계를 찾을 수 없습니다.");
  }

  mockFriendships.splice(index, 1);
  },
};
