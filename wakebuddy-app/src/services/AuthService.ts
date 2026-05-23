import { User } from "../models/User";

// 임시 사용자 저장소 (Firebase 연동 전)
let currentUser: User | null = null;

const mockUsers: User[] = [];

export const AuthService = {
  // 회원가입
  async signUp(
    email: string,
    password: string,
    displayName: string,
  ): Promise<User> {
    // 이메일 중복 확인
    const exists = mockUsers.find((u) => u.email === email);
    if (exists) {
      throw new Error("이미 사용 중인 이메일입니다.");
    }

    const newUser: User = {
      uid: Date.now().toString(),
      email,
      displayName,
      createdAt: new Date(),
    };

    mockUsers.push(newUser);
    currentUser = newUser;
    return newUser;
  },

  // 로그인
  async login(email: string, password: string): Promise<User> {
    const user = mockUsers.find((u) => u.email === email);
    if (!user) {
      throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    currentUser = user;
    return user;
  },

  // 로그아웃
  async logout(): Promise<void> {
    currentUser = null;
  },

  // 현재 로그인한 사용자 반환
  getCurrentUser(): User | null {
    return currentUser;
  },
};
