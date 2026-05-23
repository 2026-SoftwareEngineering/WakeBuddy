import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Alarm, RepeatType, Weekday } from "../models/Alarm";
import { User } from "../models/User";
import { AlarmService } from "../services/AlarmService";

type Props = {
  currentUser: User;
  alarmId: string | null;
  goBack: () => void;
};

const WEEKDAYS: { label: string; value: Weekday }[] = [
  { label: "일", value: "sun" },
  { label: "월", value: "mon" },
  { label: "화", value: "tue" },
  { label: "수", value: "wed" },
  { label: "목", value: "thu" },
  { label: "금", value: "fri" },
  { label: "토", value: "sat" },
];

/**
 * 알람 생성/수정 화면
 *
 * 실제 알람 앱처럼 날짜, 시간, 반복 여부, 요일을 선택할 수 있다.
 */
export default function AlarmFormScreen({
  currentUser,
  alarmId,
  goBack,
}: Props) {
  const [targetAlarm, setTargetAlarm] = useState<Alarm | null>(null);
  const [title, setTitle] = useState("");

  const [alarmDate, setAlarmDate] = useState(new Date());
  const [alarmTime, setAlarmTime] = useState(new Date());

  const [repeatType, setRepeatType] = useState<RepeatType>("none");
  const [repeatDays, setRepeatDays] = useState<Weekday[]>([]);
  const [isActive, setIsActive] = useState(true);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  /**
   * 수정 모드일 경우 기존 알람 정보를 불러온다.
   */
  useEffect(() => {
    const loadAlarm = async () => {
      if (!alarmId) return;

      try {
        const alarm = await AlarmService.getAlarmById(alarmId);

        if (!alarm) {
          Alert.alert("오류", "알람을 찾을 수 없습니다.");
          goBack();
          return;
        }

        setTargetAlarm(alarm);
        setTitle(alarm.title);
        setAlarmDate(alarm.alarmDate);
        setAlarmTime(alarm.alarmTime);
        setRepeatType(alarm.repeatType);
        setRepeatDays(alarm.repeatDays);
        setIsActive(alarm.isActive);
      } catch (error) {
        Alert.alert(
          "조회 실패",
          error instanceof Error ? error.message : "오류가 발생했습니다.",
        );
      }
    };

    loadAlarm();
  }, [alarmId]);

  /**
   * 날짜 선택 결과를 반영한다.
   */
  const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);

    if (selectedDate) {
      setAlarmDate(selectedDate);
    }
  };

  /**
   * 시간 선택 결과를 반영한다.
   */
  const handleTimeChange = (_event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowTimePicker(false);

    if (selectedTime) {
      setAlarmTime(selectedTime);
    }
  };

  /**
   * 요일 선택/해제를 처리한다.
   */
  const toggleWeekday = (weekday: Weekday) => {
    setRepeatDays((prev) => {
      if (prev.includes(weekday)) {
        return prev.filter((day) => day !== weekday);
      }

      return [...prev, weekday];
    });
  };

  /**
   * 반복 유형을 변경한다.
   *
   * 반복 없음 또는 매일 반복을 선택하면 요일 선택값은 초기화한다.
   */
  const handleRepeatTypeChange = (nextRepeatType: RepeatType) => {
    setRepeatType(nextRepeatType);

    if (nextRepeatType !== "weekly") {
      setRepeatDays([]);
    }
  };

  /**
   * 알람 저장
   *
   * 생성 모드면 createAlarm,
   * 수정 모드면 updateAlarm을 호출한다.
   */
  const handleSave = async () => {
    try {
      if (targetAlarm) {
        await AlarmService.updateAlarm(targetAlarm.alarmId, {
          title,
          alarmDate,
          alarmTime,
          repeatType,
          repeatDays,
          isActive,
        });

        Alert.alert("수정 완료", "알람이 수정되었습니다.");
      } else {
        await AlarmService.createAlarm({
          ownerId: currentUser.uid,
          creatorId: currentUser.uid,
          title,
          alarmDate,
          alarmTime,
          repeatType,
          repeatDays,
          isActive,
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{targetAlarm ? "알람 수정" : "알람 생성"}</Text>

      <Text style={styles.label}>알람 제목</Text>
      <TextInput
        style={styles.input}
        placeholder="예: 아침 기상"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>날짜</Text>
      <TouchableOpacity
        style={styles.selectBox}
        onPress={() => setShowDatePicker(true)}
      >
        <Text>{alarmDate.toLocaleDateString()}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={alarmDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      <Text style={styles.label}>시간</Text>
      <TouchableOpacity
        style={styles.selectBox}
        onPress={() => setShowTimePicker(true)}
      >
        <Text>
          {alarmTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </TouchableOpacity>

      {showTimePicker && (
        <DateTimePicker
          value={alarmTime}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}

      <Text style={styles.label}>반복 설정</Text>
      <View style={styles.repeatRow}>
        <TouchableOpacity
          style={[
            styles.repeatButton,
            repeatType === "none" && styles.activeButton,
          ]}
          onPress={() => handleRepeatTypeChange("none")}
        >
          <Text
            style={[
              styles.repeatButtonText,
              repeatType === "none" && styles.activeButtonText,
            ]}
          >
            없음
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.repeatButton,
            repeatType === "daily" && styles.activeButton,
          ]}
          onPress={() => handleRepeatTypeChange("daily")}
        >
          <Text
            style={[
              styles.repeatButtonText,
              repeatType === "daily" && styles.activeButtonText,
            ]}
          >
            매일
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.repeatButton,
            repeatType === "weekly" && styles.activeButton,
          ]}
          onPress={() => handleRepeatTypeChange("weekly")}
        >
          <Text
            style={[
              styles.repeatButtonText,
              repeatType === "weekly" && styles.activeButtonText,
            ]}
          >
            요일
          </Text>
        </TouchableOpacity>
      </View>

      {repeatType === "weekly" && (
        <>
          <Text style={styles.label}>반복 요일</Text>
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((day) => {
              const selected = repeatDays.includes(day.value);

              return (
                <TouchableOpacity
                  key={day.value}
                  style={[
                    styles.weekdayButton,
                    selected && styles.activeButton,
                  ]}
                  onPress={() => toggleWeekday(day.value)}
                >
                  <Text
                    style={[
                      styles.weekdayText,
                      selected && styles.activeButtonText,
                    ]}
                  >
                    {day.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      <View style={styles.switchRow}>
        <Text style={styles.label}>알람 활성화</Text>
        <Switch value={isActive} onValueChange={setIsActive} />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>저장</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={goBack}>
        <Text style={styles.backText}>뒤로가기</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 70,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 14,
  },
  selectBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 14,
  },
  repeatRow: {
    flexDirection: "row",
    gap: 8,
  },
  repeatButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
  },
  repeatButtonText: {
    textAlign: "center",
    fontWeight: "700",
    color: "#333",
  },
  weekdayRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  weekdayButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  weekdayText: {
    fontWeight: "700",
    color: "#333",
  },
  activeButton: {
    backgroundColor: "#222",
    borderColor: "#222",
  },
  activeButtonText: {
    color: "#fff",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: "#222",
    padding: 15,
    borderRadius: 12,
    marginTop: 28,
  },
  saveButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
  },
  backText: {
    textAlign: "center",
    color: "#666",
    marginTop: 18,
  },
});