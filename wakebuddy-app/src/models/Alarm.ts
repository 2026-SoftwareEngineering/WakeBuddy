export type RepeatType = "none" | "daily" | "weekly";

export type Weekday = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export type Alarm = {
  alarmId: string;

  // 알람이 설정된 대상 사용자
  // 내 알람이면 ownerId === creatorId
  // 친구에게 만든 알람이면 ownerId는 친구 uid, creatorId는 만든 사람 uid
  ownerId: string;

  // 알람을 생성한 사용자
  creatorId: string;

  // 알람 제목
  title: string;

  // 알람 날짜
  alarmDate: Date;

  // 알람 시간
  alarmTime: Date;

  // 반복 유형
  // none: 반복 없음
  // daily: 매일 반복
  // weekly: 선택 요일 반복
  repeatType: RepeatType;

  // weekly 반복일 때 사용하는 요일 목록
  repeatDays: Weekday[];

  // 알람 활성화 여부
  isActive: boolean;

  // Expo Notifications로 예약한 알림 ID
  // NotificationService 연동 후 사용
  notificationId?: string;

  createdAt: Date;
  updatedAt: Date;
};

export type CreateAlarmInput = {
  ownerId: string;
  creatorId: string;
  title: string;
  alarmDate: Date;
  alarmTime: Date;
  repeatType: RepeatType;
  repeatDays: Weekday[];
  isActive: boolean;
  notificationId?: string;
};

export type UpdateAlarmInput = Partial<
  Pick<
    Alarm,
    | "title"
    | "alarmDate"
    | "alarmTime"
    | "repeatType"
    | "repeatDays"
    | "isActive"
    | "notificationId"
  >
>;