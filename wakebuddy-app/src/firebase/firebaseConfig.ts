import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Firebase 연결 설정
 *
 * .env 파일에 저장된 Firebase 프로젝트 설정값을 읽어와
 * Firebase 앱, Authentication, Firestore를 초기화한다.
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firebase Authentication 인스턴스
export const auth = getAuth(app);

// Cloud Firestore 인스턴스
export const db = getFirestore(app);