import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { User } from "./src/models/User";
import { AuthService } from "./src/services/AuthService";

import MainScreen from "./src/screens/MainScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import AppHomeScreen from "./src/screens/AppHomeScreen";
import AlarmFormScreen from "./src/screens/AlarmFormScreen";

/**
 * 앱 전체 화면 이름
 *
 * 기본 Expo 구조에서는 Expo Router를 사용하지 않으므로,
 * App.tsx에서 현재 화면 상태를 직접 관리한다.
 */
export type ScreenName = "main" | "login" | "signup" | "home" | "alarmForm";

export default function App() {
  const [screen, setScreen] = useState<ScreenName>("main");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  /**
   * 앱 실행 시 Firebase 로그인 상태를 감지한다.
   *
   * 이미 로그인된 사용자가 있으면 로그인 후 홈 화면으로 이동하고,
   * 로그인된 사용자가 없으면 Main 화면을 보여준다.
   */
  useEffect(() => {
    const unsubscribe = AuthService.watchAuthState((user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);

      if (user) {
        setScreen("home");
      } else {
        setScreen("main");
      }
    });

    return unsubscribe;
  }, []);

  /**
   * 알람 생성 화면으로 이동한다.
   */
  const goCreateAlarm = () => {
    setEditingAlarmId(null);
    setScreen("alarmForm");
  };

  /**
   * 알람 수정 화면으로 이동한다.
   */
  const goEditAlarm = (alarmId: string) => {
    setEditingAlarmId(alarmId);
    setScreen("alarmForm");
  };

  /**
   * Firebase 로그인 상태 확인 중 표시할 로딩 화면
   */
  if (isAuthLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (screen === "login") {
    return (
      <LoginScreen
        goMain={() => setScreen("main")}
        goSignUp={() => setScreen("signup")}
      />
    );
  }

  if (screen === "signup") {
    return (
      <SignUpScreen
        goMain={() => setScreen("main")}
        goLogin={() => setScreen("login")}
      />
    );
  }

  if (screen === "home" && currentUser) {
    return (
      <AppHomeScreen
        currentUser={currentUser}
        goCreateAlarm={goCreateAlarm}
        goEditAlarm={goEditAlarm}
      />
    );
  }

  if (screen === "alarmForm" && currentUser) {
    return (
      <AlarmFormScreen
        currentUser={currentUser}
        alarmId={editingAlarmId}
        goBack={() => setScreen("home")}
      />
    );
  }

  return (
    <MainScreen
      goLogin={() => setScreen("login")}
      goSignUp={() => setScreen("signup")}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});