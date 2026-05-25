import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { User } from "./src/models/User";
import { AuthService } from "./src/services/AuthService";
import { AlarmService } from "./src/services/AlarmService";
import { NotificationService } from "./src/services/NotificationService";

import MainScreen from "./src/screens/MainScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import AppHomeScreen from "./src/screens/AppHomeScreen";
import AlarmFormScreen from "./src/screens/AlarmFormScreen";
import { useState } from "react";

/**
 * 앱 전체 화면 이름
 */
export type ScreenName = "main" | "login" | "signup" | "home" | "alarmForm";

export default function App() {
  const [screen, setScreen] = useState<ScreenName>("main");

  // 현재 로그인한 사용자 정보
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // 알람 수정 시 사용할 알람 ID
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);

  // 친구 알람 생성 시 알람 대상자가 되는 친구 uid
  const [alarmOwnerId, setAlarmOwnerId] = useState<string | null>(null);

  // 친구 알람 생성 화면에 표시할 친구 이름
  const [alarmOwnerName, setAlarmOwnerName] = useState<string | null>(null);

  // Firebase 로그인 상태 확인 중인지 여부
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  /**
   * 앱 실행 시 Firebase 로그인 상태를 감지한다.
   */
  useEffect(() => {
    const unsubscribe = AuthService.watchAuthState(async (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);

      if (user) {
        setScreen("home");

        try {
          await AlarmService.syncMyActiveAlarms(user.uid);
        } catch (error) {
          console.log("알람 동기화 실패:", error);
        }
      } else {
        setScreen("main");
      }
    });

    return unsubscribe;
  }, []);

  /**
   * 알림을 눌렀을 때 실행되는 리스너 등록
   *
   * 알림을 누르면 앱이 열리고,
   * NotificationService에서 알림 센터에 남은 알림을 정리한다.
   */
  useEffect(() => {
    const unsubscribe =
      NotificationService.registerNotificationResponseListener();

    return unsubscribe;
  }, []);

  /**
   * 내 알람 생성 화면으로 이동한다.
   */
  const goCreateAlarm = () => {
    setEditingAlarmId(null);
    setAlarmOwnerId(null);
    setAlarmOwnerName(null);
    setScreen("alarmForm");
  };

  /**
   * 친구 알람 생성 화면으로 이동한다.
   */
  const goCreateFriendAlarm = (friendId: string, friendName: string) => {
    setEditingAlarmId(null);
    setAlarmOwnerId(friendId);
    setAlarmOwnerName(friendName);
    setScreen("alarmForm");
  };

  /**
   * 알람 수정 화면으로 이동한다.
   */
  const goEditAlarm = (alarmId: string) => {
    setEditingAlarmId(alarmId);
    setAlarmOwnerId(null);
    setAlarmOwnerName(null);
    setScreen("alarmForm");
  };

  /**
   * 로그인 상태 확인 중 보여줄 로딩 화면
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
        goCreateFriendAlarm={goCreateFriendAlarm}
        goEditAlarm={goEditAlarm}
      />
    );
  }

  if (screen === "alarmForm" && currentUser) {
    return (
      <AlarmFormScreen
        currentUser={currentUser}
        alarmId={editingAlarmId}
        alarmOwnerId={alarmOwnerId}
        alarmOwnerName={alarmOwnerName}
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