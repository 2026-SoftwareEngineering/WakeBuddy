import { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Alarm } from "../models/Alarm";
import { AlarmService } from "../services/AlarmService";
import { AuthService } from "../services/AuthService";

const DEMO_USER_ID = "demo-user";

type Props = {
  alarmId: string | null;
  goBack: () => void;
};

export default function AlarmFormScreen({ alarmId, goBack }: Props) {
  const [targetAlarm, setTargetAlarm] = useState<Alarm | null>(null);
  const [title, setTitle] = useState("");
  const [timeText, setTimeText] = useState("");

  const getUserId = () => AuthService.getCurrentUser()?.uid ?? DEMO_USER_ID;

  useEffect(() => {
    const loadAlarm = async () => {
      if (!alarmId) return;

      const alarms = await AlarmService.getMyAlarms(getUserId());
      const found = alarms.find((alarm) => alarm.alarmId === alarmId);

      if (found) {
        setTargetAlarm(found);
        setTitle(found.title);
        setTimeText(new Date(found.time).toISOString().slice(0, 16));
      }
    };

    loadAlarm();
  }, [alarmId]);

  const handleSave = async () => {
    try {
      if (!title || !timeText) {
        Alert.alert("입력 오류", "알람 제목과 시간을 입력해주세요.");
        return;
      }

      const time = new Date(timeText);

      if (Number.isNaN(time.getTime())) {
        Alert.alert("입력 오류", "시간 형식이 올바르지 않습니다.");
        return;
      }

      const userId = getUserId();

      if (targetAlarm) {
        await AlarmService.updateAlarm(targetAlarm.alarmId, {
          title,
          time,
        });
        Alert.alert("수정 완료", "알람이 수정되었습니다.");
      } else {
        await AlarmService.createAlarm({
          ownerId: userId,
          creatorId: userId,
          title,
          time,
          isActive: true,
        });
        Alert.alert("생성 완료", "알람이 생성되었습니다.");
      }

      goBack();
    } catch (error) {
      Alert.alert(
        "저장 실패",
        error instanceof Error ? error.message : "오류가 발생했습니다.",
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{targetAlarm ? "알람 수정" : "알람 생성"}</Text>

      <TextInput
        style={styles.input}
        placeholder="알람 제목"
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        style={styles.input}
        placeholder="시간 예: 2026-05-24T08:00"
        value={timeText}
        onChangeText={setTimeText}
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>저장</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={goBack}>
        <Text style={styles.backText}>내 알람으로 돌아가기</Text>
      </TouchableOpacity>

      <Text style={styles.help}>
        MVP 단계에서는 날짜/시간 선택기 대신 텍스트 입력을 사용합니다.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 80,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#222",
    padding: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
  backText: {
    marginTop: 18,
    textAlign: "center",
    color: "#666",
  },
  help: {
    marginTop: 20,
    color: "#777",
    lineHeight: 20,
  },
});