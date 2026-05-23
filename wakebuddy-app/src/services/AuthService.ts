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
 * 우리 앱에서 사용하는 User 타입으로 변환한다.
 *
 * 단, Firebase Authentication에는 createdAt, displayName 같은
 * 앱 전용 프로필 정보가 충분히 없을 수 있으므로,
 * Firestore users 컬렉션 문서가 없을 때의 보조 변환용으로 사용한다.
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
 * 우리 앱에서 사용하는 User 타입으로 변환한다.
 *
 * Firestore의 createdAt은 Timestamp 타입으로 저장되므로,
 * 앱에서 사용하기 쉽게 Date 타입으로 변환한다.
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
   * 1. 이메일, 비밀번호, 이름 입력값을 검증한다.
   * 2. Firebase Authentication에 계정을 생성한다.
   * 3. 생성된 uid를 기준으로 Firestore users 컬렉션에 사용자 프로필을 저장한다.
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
   * 1. 이메일과 비밀번호 입력값을 검증한다.
   * 2. Firebase Authentication으로 로그인한다.
   * 3. Firestore users 컬렉션에서 사용자 프로필을 조회하여 반환한다.
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
   *
   * Firebase Authentication의 현재 로그인 세션을 종료한다.
   */
  async logout(): Promise<void> {
    await signOut(auth);
  },

  /**
   * 현재 Firebase Authentication에 로그인된 사용자 객체를 반환한다.
   *
   * uid만 빠르게 필요할 때 사용한다.
   * 예: 알람 생성 시 ownerId로 현재 사용자 uid를 넣을 때
   */
  getCurrentFirebaseUser(): FirebaseUser | null {
    return auth.currentUser;
  },

  /**
   * 현재 로그인한 사용자의 앱 프로필 정보를 반환한다.
   *
   * Firebase Authentication의 현재 사용자 uid를 기준으로
   * Firestore users 컬렉션에서 사용자 프로필을 조회한다.
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
   * 로그인 상태 변화를 감지한다.
   *
   * 앱이 실행될 때 사용자가 이미 로그인되어 있는지 확인하거나,
   * 로그인/로그아웃 상태가 바뀔 때 화면을 전환하기 위해 사용한다.
   *
   * 반환값은 구독 해제 함수이므로, useEffect에서 cleanup으로 반환하면 된다.
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