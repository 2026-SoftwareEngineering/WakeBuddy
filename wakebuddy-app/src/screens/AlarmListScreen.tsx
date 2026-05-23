import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Alarm } from "../models/Alarm";
import { User } from "../models/User";
import { AlarmService } from "../services/AlarmService";

type Props = {
  currentUser: User;
  goCreateAlarm: () => void;
  goEditAlarm: (alarmId: string) => void;
};

type AlarmViewMode = "my" | "createdForFriends";

/**
 * 내 알람 목록 화면
 *
 * 내 알람과 내가 만든 친구 알람을 구분해서 조회한다.
 *
 * 내 알람:
 * - ownerId가 현재 사용자 uid인 알람
 *
 * 내가 만든 친구 알람:
 * - creatorId가 현재 사용자 uid이고
 * - ownerId가 현재 사용자 uid가 아닌 알람
 */
export default function AlarmListScreen({
  currentUser,
  goCreateAlarm,
  goEditAlarm,
}: Props) {
  const [viewMode, setViewMode] = useState<AlarmViewMode>("my");

  const [myAlarms, setMyAlarms] = useState<Alarm[]>([]);
  const [createdFriendAlarms, setCreatedFriendAlarms] = useState<Alarm[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 현재 사용자의 알람 목록을 불러온다.
   *
   * getMyAlarms:
   * - ownerId가 현재 사용자 uid인 알람 조회
   *
   * getCreatedAlarms:
   * - creatorId가 현재 사용자 uid인 알람 조회
   *
   * createdFriendAlarms:
   * - 내가 생성했지만 대상자가 내가 아닌 알람
   * - 즉, 내가 친구에게 만들어준 알람
   */
  const loadAlarms = async () => {
    try {
      setIsLoading(true);

      const myAlarmData = await AlarmService.getMyAlarms(currentUser.uid);
      const createdAlarmData = await AlarmService.getCreatedAlarms(
        currentUser.uid,
      );

      const friendAlarmData = createdAlarmData.filter(
        (alarm) => alarm.ownerId !== currentUser.uid,
      );

      setMyAlarms(myAlarmData);
      setCreatedFriendAlarms(friendAlarmData);
    } catch (error) {
      Alert.alert(
        "알람 조회 실패",
        error instanceof Error ? error.message : "오류가 발생했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlarms();
  }, []);

  /**
   * 현재 선택된 탭에 따라 표시할 알람 목록을 결정한다.
   */
  const alarms =
    viewMode === "my" ? myAlarms : createdFriendAlarms;

  /**
   * 알람 삭제
   */
  const handleDelete = async (alarmId: string) => {
    try {
      await AlarmService.deleteAlarm(alarmId);
      await loadAlarms();
    } catch (error) {
      Alert.alert(
        "삭제 실패",
        error instanceof Error ? error.message : "오류가 발생했습니다.",
      );
    }
  };

  /**
   * 알람 활성화/비활성화
   */
  const handleToggle = async (alarmId: string, isActive: boolean) => {
    try {
      await AlarmService.toggleAlarm(alarmId, isActive);
      await loadAlarms();
    } catch (error) {
      Alert.alert(
        "상태 변경 실패",
        error instanceof Error ? error.message : "오류가 발생했습니다.",
      );
    }
  };

  /**
   * 날짜와 시간을 화면에 표시하기 위한 문자열로 변환한다.
   */
  const formatAlarmDateTime = (alarm: Alarm) => {
    const date = alarm.alarmDate.toLocaleDateString();
    const time = alarm.alarmTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `${date} ${time}`;
  };

  /**
   * 반복 설정을 화면에 표시한다.
   */
  const formatRepeat = (alarm: Alarm) => {
    if (alarm.repeatType === "none") {
      return "반복 없음";
    }

    if (alarm.repeatType === "daily") {
      return "매일 반복";
    }

    return `요일 반복: ${alarm.repeatDays.join(", ")}`;
  };

  /**
   * 현재 탭의 빈 목록 문구를 반환한다.
   */
  const getEmptyText = () => {
    if (viewMode === "my") {
      return "등록된 내 알람이 없습니다.";
    }

    return "내가 만든 친구 알람이 없습니다.";
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>알람</Text>
          <Text style={styles.subtitle}>{currentUser.displayName}님의 알람</Text>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={goCreateAlarm}>
          <Text style={styles.addButtonText}>+ 내 알람</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            viewMode === "my" && styles.activeModeButton,
          ]}
          onPress={() => setViewMode("my")}
        >
          <Text
            style={[
              styles.modeButtonText,
              viewMode === "my" && styles.activeModeButtonText,
            ]}
          >
            내 알람
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeButton,
            viewMode === "createdForFriends" && styles.activeModeButton,
          ]}
          onPress={() => setViewMode("createdForFriends")}
        >
          <Text
            style={[
              styles.modeButtonText,
              viewMode === "createdForFriends" &&
                styles.activeModeButtonText,
            ]}
          >
            내가 만든 친구 알람
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={alarms}
        refreshing={isLoading}
        onRefresh={loadAlarms}
        keyExtractor={(item) => item.alarmId}
        ListEmptyComponent={<Text style={styles.empty}>{getEmptyText()}</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.cardTitleBox}>
                <Text style={styles.alarmTitle}>{item.title}</Text>

                {item.ownerId !== currentUser.uid && (
                  <Text style={styles.friendAlarmBadge}>
                    친구에게 만든 알람
                  </Text>
                )}

                {item.ownerId === currentUser.uid &&
                  item.creatorId !== currentUser.uid && (
                    <Text style={styles.friendAlarmBadge}>
                      친구가 나에게 설정한 알람
                    </Text>
                  )}

                <Text style={styles.alarmTime}>
                  {formatAlarmDateTime(item)}
                </Text>

                <Text style={styles.repeatText}>{formatRepeat(item)}</Text>
              </View>

              <Switch
                value={item.isActive}
                onValueChange={(value) => handleToggle(item.alarmId, value)}
              />
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => goEditAlarm(item.alarmId)}
              >
                <Text style={styles.editButtonText}>수정</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.alarmId)}
              >
                <Text style={styles.deleteButtonText}>삭제</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#666",
    marginTop: 4,
  },
  addButton: {
    backgroundColor: "#222",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  modeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 11,
    borderRadius: 10,
  },
  activeModeButton: {
    backgroundColor: "#222",
    borderColor: "#222",
  },
  modeButtonText: {
    textAlign: "center",
    color: "#333",
    fontWeight: "700",
  },
  activeModeButtonText: {
    color: "#fff",
  },
  empty: {
    textAlign: "center",
    color: "#777",
    marginTop: 40,
  },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardTitleBox: {
    flex: 1,
    paddingRight: 12,
  },
  alarmTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  friendAlarmBadge: {
    marginTop: 6,
    color: "#244a99",
    fontWeight: "700",
  },
  alarmTime: {
    color: "#444",
    marginTop: 6,
  },
  repeatText: {
    color: "#777",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  editButton: {
    flex: 1,
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 10,
  },
  editButtonText: {
    textAlign: "center",
    fontWeight: "700",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#ffdddd",
    padding: 10,
    borderRadius: 10,
  },
  deleteButtonText: {
    textAlign: "center",
    color: "#c00",
    fontWeight: "700",
  },
});