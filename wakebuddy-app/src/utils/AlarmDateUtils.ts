import { Alarm, Weekday } from "../models/Alarm";

/**
 * 앱에서 사용하는 요일 문자열을 JavaScript Date의 요일 숫자로 변환한다.
 *
 * JavaScript Date 기준:
 * 0 = 일요일
 * 1 = 월요일
 * ...
 * 6 = 토요일
 */
export function weekdayToNumber(weekday: Weekday): number {
  const weekdayMap: Record<Weekday, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
  };

  return weekdayMap[weekday];
}

/**
 * 알람 시간을 오늘 날짜 기준으로 Date 객체로 만든다.
 *
 * 날짜 선택 기능이 제거되었으므로 오늘 날짜를 기준으로 사용한다.
 */
export function combineAlarmDateTime(alarm: Alarm): Date {
  const combined = new Date();

  combined.setHours(alarm.alarmTime.getHours());
  combined.setMinutes(alarm.alarmTime.getMinutes());
  combined.setSeconds(0);
  combined.setMilliseconds(0);

  return combined;
}

/**
 * 반복 없음 알람의 실행 시간을 계산한다.
 *
 * 이미 지난 시간이면 오류를 발생시켜 사용자가 미래 시간을 다시 선택하게 한다.
 */
export function getOneTimeAlarmDate(alarm: Alarm): Date {
  const now = new Date();
  const next = new Date();

  next.setHours(alarm.alarmTime.getHours());
  next.setMinutes(alarm.alarmTime.getMinutes());
  next.setSeconds(0);
  next.setMilliseconds(0);

  if (next.getTime() <= now.getTime()) {
    throw new Error("현재 시간 이후의 알람 시간을 선택해주세요.");
  }

  return next;
}

/**
 * 매일 반복 알람의 첫 실행 시간을 계산한다.
 *
 * 오늘의 해당 시간이 이미 지났다면 내일 같은 시간으로 예약한다.
 */
export function getNextDailyAlarmDate(alarm: Alarm): Date {
  const now = new Date();
  const next = new Date();

  next.setHours(alarm.alarmTime.getHours());
  next.setMinutes(alarm.alarmTime.getMinutes());
  next.setSeconds(0);
  next.setMilliseconds(0);

  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

/**
 * 특정 요일 반복 알람의 다음 실행 시간을 계산한다.
 *
 * 예를 들어 월/수/금 반복이고 오늘이 화요일이면 수요일 시간을 반환한다.
 */
export function getNextWeeklyAlarmDate(alarm: Alarm, weekday: Weekday): Date {
  const now = new Date();
  const targetDay = weekdayToNumber(weekday);

  const next = new Date();
  next.setHours(alarm.alarmTime.getHours());
  next.setMinutes(alarm.alarmTime.getMinutes());
  next.setSeconds(0);
  next.setMilliseconds(0);

  const currentDay = next.getDay();
  let daysUntilTarget = targetDay - currentDay;

  if (daysUntilTarget < 0) {
    daysUntilTarget += 7;
  }

  next.setDate(next.getDate() + daysUntilTarget);

  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 7);
  }

  return next;
}