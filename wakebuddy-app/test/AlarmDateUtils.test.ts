import { Alarm } from "../src/models/Alarm";
import {
  getNextDailyAlarmDate,
  getNextWeeklyAlarmDate,
  getOneTimeAlarmDate,
  weekdayToNumber,
} from "../src/utils/AlarmDateUtils";

function createTestAlarm(hour: number, minute: number): Alarm {
  const alarmTime = new Date();
  alarmTime.setHours(hour);
  alarmTime.setMinutes(minute);
  alarmTime.setSeconds(0);
  alarmTime.setMilliseconds(0);

  return {
    alarmId: "alarm-1",
    ownerId: "user-1",
    creatorId: "user-1",
    title: "테스트 알람",
    alarmTime,
    repeatType: "none",
    repeatDays: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("AlarmDateUtils", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-26T10:00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("weekdayToNumber", () => {
    test("요일 문자열을 JavaScript Date 요일 숫자로 변환한다.", () => {
      expect(weekdayToNumber("sun")).toBe(0);
      expect(weekdayToNumber("mon")).toBe(1);
      expect(weekdayToNumber("tue")).toBe(2);
      expect(weekdayToNumber("wed")).toBe(3);
      expect(weekdayToNumber("thu")).toBe(4);
      expect(weekdayToNumber("fri")).toBe(5);
      expect(weekdayToNumber("sat")).toBe(6);
    });
  });

  describe("getOneTimeAlarmDate", () => {
    test("현재 시간 이후의 알람 시간이면 해당 시간을 반환한다.", () => {
      const alarm = createTestAlarm(11, 30);

      const result = getOneTimeAlarmDate(alarm);

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(4);
      expect(result.getDate()).toBe(26);
      expect(result.getHours()).toBe(11);
      expect(result.getMinutes()).toBe(30);
    });

    test("현재 시간 이전의 알람 시간이면 오류가 발생한다.", () => {
      const alarm = createTestAlarm(9, 30);

      expect(() => {
        getOneTimeAlarmDate(alarm);
      }).toThrow("현재 시간 이후의 알람 시간을 선택해주세요.");
    });

    test("현재 시간과 같은 알람 시간이면 오류가 발생한다.", () => {
      const alarm = createTestAlarm(10, 0);

      expect(() => {
        getOneTimeAlarmDate(alarm);
      }).toThrow("현재 시간 이후의 알람 시간을 선택해주세요.");
    });
  });

  describe("getNextDailyAlarmDate", () => {
    test("오늘 알람 시간이 아직 지나지 않았다면 오늘 날짜로 반환한다.", () => {
      const alarm = createTestAlarm(11, 0);

      const result = getNextDailyAlarmDate(alarm);

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(4);
      expect(result.getDate()).toBe(26);
      expect(result.getHours()).toBe(11);
      expect(result.getMinutes()).toBe(0);
    });

    test("오늘 알람 시간이 이미 지났다면 다음 날 날짜로 반환한다.", () => {
      const alarm = createTestAlarm(9, 0);

      const result = getNextDailyAlarmDate(alarm);

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(4);
      expect(result.getDate()).toBe(27);
      expect(result.getHours()).toBe(9);
      expect(result.getMinutes()).toBe(0);
    });

    test("오늘 알람 시간이 현재 시간과 같다면 다음 날 날짜로 반환한다.", () => {
      const alarm = createTestAlarm(10, 0);

      const result = getNextDailyAlarmDate(alarm);

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(4);
      expect(result.getDate()).toBe(27);
      expect(result.getHours()).toBe(10);
      expect(result.getMinutes()).toBe(0);
    });
  });

  describe("getNextWeeklyAlarmDate", () => {
    test("선택한 요일이 오늘이고 시간이 아직 지나지 않았다면 오늘 날짜로 반환한다.", () => {
      const alarm = createTestAlarm(11, 0);

      const result = getNextWeeklyAlarmDate(alarm, "tue");

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(4);
      expect(result.getDate()).toBe(26);
      expect(result.getHours()).toBe(11);
      expect(result.getMinutes()).toBe(0);
    });

    test("선택한 요일이 오늘이지만 시간이 지났다면 다음 주 같은 요일로 반환한다.", () => {
      const alarm = createTestAlarm(9, 0);

      const result = getNextWeeklyAlarmDate(alarm, "tue");

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(5);
      expect(result.getDate()).toBe(2);
      expect(result.getHours()).toBe(9);
      expect(result.getMinutes()).toBe(0);
    });

    test("선택한 요일이 이번 주 이후라면 해당 요일 날짜로 반환한다.", () => {
      const alarm = createTestAlarm(8, 30);

      const result = getNextWeeklyAlarmDate(alarm, "wed");

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(4);
      expect(result.getDate()).toBe(27);
      expect(result.getHours()).toBe(8);
      expect(result.getMinutes()).toBe(30);
    });

    test("선택한 요일이 이미 지난 요일이면 다음 주 해당 요일로 반환한다.", () => {
      const alarm = createTestAlarm(8, 30);

      const result = getNextWeeklyAlarmDate(alarm, "mon");

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(5);
      expect(result.getDate()).toBe(1);
      expect(result.getHours()).toBe(8);
      expect(result.getMinutes()).toBe(30);
    });
  });
});