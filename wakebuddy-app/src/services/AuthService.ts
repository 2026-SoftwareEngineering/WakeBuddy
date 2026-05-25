import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  Timestamp,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import { User } from "../models/User";

/**
 * Firebase Authentication의 사용자 객체를
 * 앱에서 사용하는 User 타입으로 변환한다.
 *
 * Firestore users 문서가 없을 때 보조 변환용으로 사용한다.
 */
function mapFirebaseUser(firebaseUser: FirebaseUser): User {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? "",
    displayName: firebaseUser.displayName ?? "",
    createdAt: new Date(),
  };
}

/**
 * Firestore users 컬렉션의 사용자 문서를
 * 앱에서 사용하는 User 타입으로 변환한다.
 */
function mapUserDocument(uid: string, data: any): User {
  const createdAt =
    data.createdAt instanceof Timestamp
      ? data.createdAt.toDate()
      : new Date();

  return {
    uid,
    email: data.email ?? "",
    displayName: data.displayName ?? "",
    createdAt,
  };
}

export const AuthService = {
  /**
   * 회원가입
   *
   * 1. 이메일, 비밀번호, 이름을 검증한다.
   * 2. Firebase Authentication에 계정을 생성한다.
   * 3. Firestore users 컬렉션에 사용자 프로필을 저장한다.
   */
  async signUp(
    email: string,
    password: string,
    displayName: string,
  ): Promise<User> {
    if (!email.trim()) {
      throw new Error("이메일을 입력해주세요.");
    }

    if (!password.trim()) {
      throw new Error("비밀번호를 입력해주세요.");
    }

    if (!displayName.trim()) {
      throw new Error("이름을 입력해주세요.");
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    const firebaseUser = userCredential.user;

    await setDoc(doc(db, "users", firebaseUser.uid), {
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? email,
      displayName,
      createdAt: serverTimestamp(),
    });

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? email,
      displayName,
      createdAt: new Date(),
    };
  },

  /**
   * 로그인
   *
   * Firebase Authentication으로 로그인한 뒤,
   * Firestore users 컬렉션에서 사용자 프로필을 조회한다.
   */
  async login(email: string, password: string): Promise<User> {
    if (!email.trim()) {
      throw new Error("이메일을 입력해주세요.");
    }

    if (!password.trim()) {
      throw new Error("비밀번호를 입력해주세요.");
    }

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );

    const firebaseUser = userCredential.user;
    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

    if (userDoc.exists()) {
      return mapUserDocument(firebaseUser.uid, userDoc.data());
    }

    return mapFirebaseUser(firebaseUser);
  },

  /**
   * 로그아웃
   */
  async logout(): Promise<void> {
    await signOut(auth);
  },

  /**
   * 현재 Firebase 로그인 사용자 반환
   *
   * uid만 빠르게 필요할 때 사용한다.
   */
  getCurrentFirebaseUser(): FirebaseUser | null {
    return auth.currentUser;
  },

  /**
   * 현재 로그인한 사용자의 앱 프로필 반환
   */
  async getCurrentUser(): Promise<User | null> {
    const firebaseUser = auth.currentUser;

    if (!firebaseUser) {
      return null;
    }

    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

    if (userDoc.exists()) {
      return mapUserDocument(firebaseUser.uid, userDoc.data());
    }

    return mapFirebaseUser(firebaseUser);
  },

  /**
   * 로그인 상태 변화 감지
   *
   * 앱 시작 시 로그인 여부를 확인하거나,
   * 로그인/로그아웃에 따라 화면을 전환할 때 사용한다.
   */
  watchAuthState(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        callback(null);
        return;
      }

      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

      if (userDoc.exists()) {
        callback(mapUserDocument(firebaseUser.uid, userDoc.data()));
        return;
      }

      callback(mapFirebaseUser(firebaseUser));
    });
  },
};