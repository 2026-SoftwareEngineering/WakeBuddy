import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { User } from "../models/User";
import AlarmListScreen from "./AlarmListScreen";
import FriendTabScreen from "./FriendTabScreen";
import SettingsScreen from "./SettingsScreen";

type HomeTab = "alarm" | "friend" | "settings";

type Props = {
  currentUser: User;

  // 내 알람 생성 화면으로 이동
  goCreateAlarm: () => void;

  // 친구 알람 생성 화면으로 이동
  goCreateFriendAlarm: (friendId: string, friendName: string) => void;

  // 알람 수정 화면으로 이동
  goEditAlarm: (alarmId: string) => void;
};

/**
 * 로그인 후 보이는 앱 홈 화면
 *
 * 하단 탭으로 알람, 친구, 설정 화면을 전환한다.
 */
export default function AppHomeScreen({
  currentUser,
  goCreateAlarm,
  goCreateFriendAlarm,
  goEditAlarm,
}: Props) {
  const [tab, setTab] = useState<HomeTab>("alarm");

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {tab === "alarm" && (
          <AlarmListScreen
            currentUser={currentUser}
            goCreateAlarm={goCreateAlarm}
            goEditAlarm={goEditAlarm}
          />
        )}

        {tab === "friend" && (
          <FriendTabScreen
            currentUser={currentUser}
            goCreateFriendAlarm={goCreateFriendAlarm}
          />
        )}

        {tab === "settings" && <SettingsScreen currentUser={currentUser} />}
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setTab("alarm")}
        >
          <Text style={[styles.tabText, tab === "alarm" && styles.activeTab]}>
            알람
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setTab("friend")}
        >
          <Text style={[styles.tabText, tab === "friend" && styles.activeTab]}>
            친구
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setTab("settings")}
        >
          <Text
            style={[styles.tabText, tab === "settings" && styles.activeTab]}
          >
            설정
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  tabText: {
    color: "#777",
    fontWeight: "600",
  },
  activeTab: {
    color: "#222",
    fontWeight: "800",
  },
});