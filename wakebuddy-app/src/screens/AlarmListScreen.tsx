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

/**
 * 내 알람 목록 화면
 *
 * Firestore에서 ownerId가 현재 사용자 uid인 알람을 조회한다.
 */
export default function AlarmListScreen({
  currentUser,
  goCreateAlarm,
  goEditAlarm,
}: Props) {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 현재 사용자의 알람 목록을 불러온다.
   */
  const loadAlarms = async () => {
    try {
      setIsLoading(true);
      const data = await AlarmService.getMyAlarms(currentUser.uid);
      setAlarms(data);
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
    if (alarm.repeatType === "none") return "반복 없음";
    if (alarm.repeatType === "daily") return "매일 반복";
    return `요일 반복: ${alarm.repeatDays.join(", ")}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>내 알람</Text>
          <Text style={styles.subtitle}>{currentUser.displayName}님의 알람</Text>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={goCreateAlarm}>
          <Text style={styles.addButtonText}>+ 추가</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={alarms}
        refreshing={isLoading}
        onRefresh={loadAlarms}
        keyExtractor={(item) => item.alarmId}
        ListEmptyComponent={
          <Text style={styles.empty}>등록된 알람이 없습니다.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.cardTitleBox}>
                <Text style={styles.alarmTitle}>{item.title}</Text>
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
    marginBottom: 22,
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