import * as Notifications from "expo-notifications";
import { Alarm } from "../models/Alarm";
import {
  getNextDailyAlarmDate,
  getNextWeeklyAlarmDate,
  getOneTimeAlarmDate,
} from "../utils/alarmSchedule";

/**
 * 앱이 foreground 상태일 때 알림이 어떻게 표시될지 설정한다.
 *
 * shouldShowBanner / shouldShowList는 SDK 버전에 따라 동작이 달라질 수 있으므로,
 * 타입 오류가 나면 shouldShowAlert 방식으로 바꿔야 할 수 있다.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * 여러 개의 알림 ID를 문자열 하나로 저장하기 위한 구분자
 *
 * weekly 반복 알람은 요일별로 여러 개의 알림을 예약할 수 있으므로,
 * notificationId를 여러 개 저장할 수 있게 문자열로 합쳐둔다.
 */
const NOTIFICATION_ID_SEPARATOR = ",";

/**
 * 알림 ID 문자열을 배열로 변환한다.
 */
function parseNotificationIds(notificationId?: string): string[] {
  if (!notificationId) {
    return [];
  }

  return notificationId
    .split(NOTIFICATION_ID_SEPARATOR)
    .map((id) => id.trim())
    .filter(Boolean);
}

/**
 * 알림 ID 배열을 문자열로 변환한다.
 */
function stringifyNotificationIds(notificationIds: string[]): string {
  return notificationIds.join(NOTIFICATION_ID_SEPARATOR);
}

/**
 * 로컬 알림 예약
 *
 * Expo Notifications의 scheduleNotificationAsync를 사용해
 * 지정한 날짜/시간에 알림이 뜨도록 예약한다.
 */
async function scheduleOneNotification(
  alarm: Alarm,
  triggerDate: Date,
  repeats: boolean,
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: "WakeBuddy",
      body: alarm.title,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      repeats,
    },
  });
}

export const NotificationService = {
  /**
   * 알림 권한 요청
   *
   * 알림을 예약하기 전에 사용자에게 알림 권한을 요청한다.
   */
  async requestNotificationPermission(): Promise<boolean> {
    const currentPermission = await Notifications.getPermissionsAsync();

    if (currentPermission.status === "granted") {
      return true;
    }

    const requestedPermission = await Notifications.requestPermissionsAsync();

    return requestedPermission.status === "granted";
  },

  /**
   * 알람 알림 예약
   *
   * repeatType에 따라 알림 예약 방식이 달라진다.
   *
   * none:
   * - 한 번만 울리는 알림 예약
   *
   * daily:
   * - 매일 반복 알림 예약
   *
   * weekly:
   * - 선택한 요일마다 알림 예약
   */
  async scheduleAlarmNotification(alarm: Alarm): Promise<string> {
    if (!alarm.isActive) {
      return "";
    }

    const hasPermission = await this.requestNotificationPermission();

    if (!hasPermission) {
      throw new Error("알림 권한이 필요합니다.");
    }

    if (alarm.repeatType === "none") {
      const triggerDate = getOneTimeAlarmDate(alarm);
      const notificationId = await scheduleOneNotification(
        alarm,
        triggerDate,
        false,
      );

      return notificationId;
    }

    if (alarm.repeatType === "daily") {
      const triggerDate = getNextDailyAlarmDate(alarm);
      const notificationId = await scheduleOneNotification(
        alarm,
        triggerDate,
        true,
      );

      return notificationId;
    }

    if (alarm.repeatType === "weekly") {
      if (alarm.repeatDays.length === 0) {
        throw new Error("반복 요일을 선택해주세요.");
      }

      const notificationIds: string[] = [];

      for (const weekday of alarm.repeatDays) {
        const triggerDate = getNextWeeklyAlarmDate(alarm, weekday);
        const notificationId = await scheduleOneNotification(
          alarm,
          triggerDate,
          true,
        );

        notificationIds.push(notificationId);
      }

      return stringifyNotificationIds(notificationIds);
    }

    return "";
  },

  /**
   * 예약된 알림 취소
   *
   * notificationId가 여러 개인 경우에도 모두 취소한다.
   */
  async cancelAlarmNotification(notificationId?: string): Promise<void> {
    const notificationIds = parseNotificationIds(notificationId);

    for (const id of notificationIds) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
  },

  /**
   * 알림 재예약
   *
   * 기존 알림을 취소하고, 새 알람 정보로 다시 예약한다.
   */
  async rescheduleAlarmNotification(alarm: Alarm): Promise<string> {
    if (alarm.notificationId) {
      await this.cancelAlarmNotification(alarm.notificationId);
    }

    return this.scheduleAlarmNotification(alarm);
  },
};