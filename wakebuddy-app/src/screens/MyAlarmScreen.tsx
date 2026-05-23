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
import { AlarmService } from "../services/AlarmService";
import { AuthService } from "../services/AuthService";

const DEMO_USER_ID = "demo-user";

type Props = {
  goHome: () => void;
  goCreateAlarm: () => void;
  goEditAlarm: (alarmId: string) => void;
};

export default function MyAlarmScreen({
  goHome,
  goCreateAlarm,
  goEditAlarm,
}: Props) {
  const [alarms, setAlarms] = useState<Alarm[]>([]);

  const getUserId = () => AuthService.getCurrentUser()?.uid ?? DEMO_USER_ID;

  const loadAlarms = async () => {
    const data = await AlarmService.getMyAlarms(getUserId());
    setAlarms(data);
  };

  useEffect(() => {
    loadAlarms();
  }, []);

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

  const handleToggle = async (alarmId: string, isActive: boolean) => {
    try {
      await AlarmService.toggleAlarm(alarmId, isActive);
      await loadAlarms();
    } catch (error) {
      Alert.alert(
        "변경 실패",
        error instanceof Error ? error.message : "오류가 발생했습니다.",
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>내 알람</Text>
        <TouchableOpacity style={styles.addButton} onPress={goCreateAlarm}>
          <Text style={styles.addButtonText}>+ 추가</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={alarms}
        keyExtractor={(item) => item.alarmId}
        ListEmptyComponent={
          <Text style={styles.empty}>등록된 알람이 없습니다.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.alarmTitle}>{item.title}</Text>
              <Switch
                value={item.isActive}
                onValueChange={(value) => handleToggle(item.alarmId, value)}
              />
            </View>

            <Text style={styles.time}>
              {new Date(item.time).toLocaleString()}
            </Text>

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

      <TouchableOpacity onPress={goHome}>
        <Text style={styles.backText}>홈으로 돌아가기</Text>
      </TouchableOpacity>
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
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#222",
    paddingVertical: 10,
    paddingHorizontal: 14,
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  alarmTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  time: {
    color: "#555",
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  editButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  editButtonText: {
    textAlign: "center",
    fontWeight: "700",
  },
  deleteButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#ffdddd",
  },
  deleteButtonText: {
    textAlign: "center",
    color: "#c00",
    fontWeight: "700",
  },
  backText: {
    marginTop: 20,
    textAlign: "center",
    color: "#666",
  },
});