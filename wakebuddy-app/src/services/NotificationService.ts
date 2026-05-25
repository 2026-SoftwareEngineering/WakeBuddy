import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Alarm, Weekday } from "../models/Alarm";
import {
  getNextDailyAlarmDate,
  getNextWeeklyAlarmDate,
  getOneTimeAlarmDate,
} from "../utils/alarmSchedule";

const ALARM_SOUND_FILE = "alarm_29s.wav";
const ALARM_CHANNEL_ID = "wakebuddy-alarm-channel-v1";
const NOTIFICATION_ID_SEPARATOR = ",";

/**
 * 앱이 foreground 상태일 때 알림이 어떻게 표시될지 설정한다.
 *
 * shouldPlaySound: true로 해야 앱을 켜둔 상태에서도 알람 사운드가 난다.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function parseNotificationIds(notificationId?: string): string[] {
  if (!notificationId) {
    return [];
  }

  return notificationId
    .split(NOTIFICATION_ID_SEPARATOR)
    .map((id) => id.trim())
    .filter(Boolean);
}

function stringifyNotificationIds(notificationIds: string[]): string {
  return notificationIds.join(NOTIFICATION_ID_SEPARATOR);
}

/**
 * Expo weekly trigger에서 사용하는 요일 숫자로 변환한다.
 *
 * Expo 기준:
 * 1 = 일요일
 * 2 = 월요일
 * ...
 * 7 = 토요일
 */
function weekdayToExpoNumber(weekday: Weekday): number {
  const weekdayMap: Record<Weekday, number> = {
    sun: 1,
    mon: 2,
    tue: 3,
    wed: 4,
    thu: 5,
    fri: 6,
    sat: 7,
  };

  return weekdayMap[weekday];
}

/**
 * Android 알림 채널 생성
 *
 * Android 8 이상에서는 content.sound만으로는 커스텀 사운드가 안 날 수 있고,
 * 반드시 channel에도 sound를 지정해야 한다.
 */
async function ensureAlarmNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
    name: "WakeBuddy 알람",
    importance: Notifications.AndroidImportance.MAX,
    sound: ALARM_SOUND_FILE,
    vibrationPattern: [0, 500, 250, 500],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

/**
 * 알림 content 공통값
 */
function createNotificationContent(alarm: Alarm): Notifications.NotificationContentInput {
  return {
    title: "WakeBuddy",
    body: alarm.title,
    sound: ALARM_SOUND_FILE,
    data: {
      alarmId: alarm.alarmId,
      ownerId: alarm.ownerId,
      creatorId: alarm.creatorId,
    },
  };
}

/**
 * 반복 없음 알림 예약
 */
async function scheduleOneTimeNotification(alarm: Alarm): Promise<string> {
  const triggerDate = getOneTimeAlarmDate(alarm);

  return Notifications.scheduleNotificationAsync({
    content: createNotificationContent(alarm),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: ALARM_CHANNEL_ID,
    },
  });
}

/**
 * 매일 반복 알림 예약
 */
async function scheduleDailyNotification(alarm: Alarm): Promise<string> {
  const triggerDate = getNextDailyAlarmDate(alarm);

  return Notifications.scheduleNotificationAsync({
    content: createNotificationContent(alarm),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: triggerDate.getHours(),
      minute: triggerDate.getMinutes(),
      channelId: ALARM_CHANNEL_ID,
    },
  });
}

/**
 * 요일 반복 알림 하나 예약
 */
async function scheduleWeeklyNotification(
  alarm: Alarm,
  weekday: Weekday,
): Promise<string> {
  const triggerDate = getNextWeeklyAlarmDate(alarm, weekday);

  return Notifications.scheduleNotificationAsync({
    content: createNotificationContent(alarm),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: weekdayToExpoNumber(weekday),
      hour: triggerDate.getHours(),
      minute: triggerDate.getMinutes(),
      channelId: ALARM_CHANNEL_ID,
    },
  });
}

export const NotificationService = {
  /**
   * 알림 권한 요청
   */
  async requestNotificationPermission(): Promise<boolean> {
    await ensureAlarmNotificationChannel();

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
   * none: 한 번만 울림
   * daily: 매일 반복
   * weekly: 선택 요일마다 반복
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
      return scheduleOneTimeNotification(alarm);
    }

    if (alarm.repeatType === "daily") {
      return scheduleDailyNotification(alarm);
    }

    if (alarm.repeatType === "weekly") {
      if (alarm.repeatDays.length === 0) {
        throw new Error("반복 요일을 선택해주세요.");
      }

      const notificationIds: string[] = [];

      for (const weekday of alarm.repeatDays) {
        const notificationId = await scheduleWeeklyNotification(alarm, weekday);
        notificationIds.push(notificationId);
      }

      return stringifyNotificationIds(notificationIds);
    }

    return "";
  },

  /**
   * 예약된 알림 취소
   */
  async cancelAlarmNotification(notificationId?: string): Promise<void> {
    const notificationIds = parseNotificationIds(notificationId);

    for (const id of notificationIds) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
  },

  /**
   * 기존 알림 취소 후 재예약
   */
  async rescheduleAlarmNotification(alarm: Alarm): Promise<string> {
    if (alarm.notificationId) {
      await this.cancelAlarmNotification(alarm.notificationId);
    }

    return this.scheduleAlarmNotification(alarm);
  },

  /**
   * 알림을 눌렀을 때 실행되는 리스너 등록
   *
   * 알림을 누르면 iOS/Android 시스템 알림음은 보통 즉시 종료된다.
   * 여기서는 알림 센터에 남은 WakeBuddy 알림도 정리한다.
   */
  registerNotificationResponseListener() {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      async () => {
        await Notifications.dismissAllNotificationsAsync();
      },
    );

    return () => {
      subscription.remove();
    };
  },
};