import { useState } from "react";
import HomeScreen from "./src/screens/HomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import MyAlarmScreen from "./src/screens/MyAlarmScreen";
import AlarmFormScreen from "./src/screens/AlarmFormScreen";
import FriendListScreen from "./src/screens/FriendListScreen";

export type ScreenName =
  | "home"
  | "login"
  | "signup"
  | "myAlarms"
  | "alarmForm"
  | "friends";

export default function App() {
  const [screen, setScreen] = useState<ScreenName>("home");
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);

  const goHome = () => {
    setEditingAlarmId(null);
    setScreen("home");
  };

  const goAlarmForm = (alarmId?: string) => {
    setEditingAlarmId(alarmId ?? null);
    setScreen("alarmForm");
  };

  if (screen === "login") {
    return <LoginScreen goHome={goHome} goSignUp={() => setScreen("signup")} />;
  }

  if (screen === "signup") {
    return <SignUpScreen goHome={goHome} goLogin={() => setScreen("login")} />;
  }

  if (screen === "myAlarms") {
    return (
      <MyAlarmScreen
        goHome={goHome}
        goCreateAlarm={() => goAlarmForm()}
        goEditAlarm={goAlarmForm}
      />
    );
  }

  if (screen === "alarmForm") {
    return (
      <AlarmFormScreen
        alarmId={editingAlarmId}
        goBack={() => setScreen("myAlarms")}
      />
    );
  }

  if (screen === "friends") {
    return <FriendListScreen goHome={goHome} />;
  }

  return (
    <HomeScreen
      goLogin={() => setScreen("login")}
      goSignUp={() => setScreen("signup")}
      goMyAlarms={() => setScreen("myAlarms")}
      goFriends={() => setScreen("friends")}
    />
  );
}