import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import {
  Alarm,
  CreateAlarmInput,
  RepeatType,
  UpdateAlarmInput,
  Weekday,
} from "../models/Alarm";
import { NotificationService } from "./NotificationService";

const ALARMS_COLLECTION = "alarms";

/**
 * Firestore Timestamp 또는 Date 값을 앱에서 사용하는 Date 타입으로 변환한다.
 */
function toDate(value: unknown): Date {
  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  return new Date();
}

/**
 * Firestore 문서를 앱에서 사용하는 Alarm 타입으로 변환한다.
 */
function mapAlarmDocument(alarmId: string, data: any): Alarm {
  return {
    alarmId,
    ownerId: data.ownerId ?? "",
    creatorId: data.creatorId ?? "",
    title: data.title ?? "",
    alarmDate: data.alarmDate ? toDate(data.alarmDate) : undefined,
    alarmTime: toDate(data.alarmTime),
    repeatType: (data.repeatType ?? "none") as RepeatType,
    repeatDays: (data.repeatDays ?? []) as Weekday[],
    isActive: Boolean(data.isActive),
    notificationId: data.notificationId ?? undefined,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

/**
 * 알람 생성 입력값 검증
 */
function validateCreateAlarmInput(data: CreateAlarmInput) {
  if (!data.ownerId) {
    throw new Error("알람 대상 사용자가 없습니다.");
  }

  if (!data.creatorId) {
    throw new Error("알람 생성자가 없습니다.");
  }

  if (!data.title?.trim()) {
    throw new Error("알람 제목을 입력해주세요.");
  }

  if (!data.alarmTime) {
    throw new Error("알람 시간을 선택해주세요.");
  }

  if (Number.isNaN(data.alarmTime.getTime())) {
    throw new Error("알람 시간이 올바르지 않습니다.");
  }

  if (!data.repeatType) {
    throw new Error("반복 유형을 선택해주세요.");
  }

  if (data.repeatType === "weekly" && data.repeatDays.length === 0) {
    throw new Error("반복 요일을 선택해주세요.");
  }
}

/**
 * 알람 수정 입력값 검증
 */
function validateUpdateAlarmInput(data: UpdateAlarmInput) {
  if (data.title !== undefined && !data.title.trim()) {
    throw new Error("알람 제목을 입력해주세요.");
  }

  if (data.alarmDate !== undefined) {
    if (Number.isNaN(data.alarmDate.getTime())) {
      throw new Error("알람 날짜가 올바르지 않습니다.");
    }
  }

  if (data.alarmTime !== undefined) {
    if (Number.isNaN(data.alarmTime.getTime())) {
      throw new Error("알람 시간이 올바르지 않습니다.");
    }
  }

  if (data.repeatType === "weekly") {
    if (!data.repeatDays || data.repeatDays.length === 0) {
      throw new Error("반복 요일을 선택해주세요.");
    }
  }
}

/**
 * Firestore 저장용 알람 데이터 변환
 */
function toFirestoreAlarmData(data: CreateAlarmInput) {
  return {
    ownerId: data.ownerId,
    creatorId: data.creatorId,
    title: data.title.trim(),
    alarmDate: data.alarmDate ? Timestamp.fromDate(data.alarmDate) : null,
    alarmTime: Timestamp.fromDate(data.alarmTime),
    repeatType: data.repeatType,
    repeatDays: data.repeatDays,
    isActive: data.isActive,
    notificationId: data.notificationId ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

/**
 * Firestore 업데이트용 알람 데이터 변환
 */
function toFirestoreUpdateData(data: UpdateAlarmInput) {
  const updateData: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (data.title !== undefined) {
    updateData.title = data.title.trim();
  }

  if (data.alarmDate !== undefined) {
    updateData.alarmDate = Timestamp.fromDate(data.alarmDate);
  }

  if (data.alarmTime !== undefined) {
    updateData.alarmTime = Timestamp.fromDate(data.alarmTime);
  }

  if (data.repeatType !== undefined) {
    updateData.repeatType = data.repeatType;
  }

  if (data.repeatDays !== undefined) {
    updateData.repeatDays = data.repeatDays;
  }

  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive;
  }

  if (data.notificationId !== undefined) {
    updateData.notificationId = data.notificationId;
  }

  return updateData;
}

/**
 * 알람을 OS 로컬 알림으로 예약하고 Firestore notificationId를 갱신한다.
 */
async function scheduleAndSaveNotificationId(alarm: Alarm): Promise<Alarm> {
  if (!alarm.isActive) {
    return alarm;
  }

  const notificationId =
    await NotificationService.scheduleAlarmNotification(alarm);

  const alarmRef = doc(db, ALARMS_COLLECTION, alarm.alarmId);

  await updateDoc(alarmRef, {
    notificationId,
    updatedAt: serverTimestamp(),
  });

  return {
    ...alarm,
    notificationId,
    updatedAt: new Date(),
  };
}

export const AlarmService = {
  /**
   * 내 알람 조회
   *
   * ownerId가 현재 사용자 uid와 같은 알람을 조회한다.
   * 내 알람에는 내가 직접 만든 알람뿐 아니라,
   * 친구가 나에게 설정해준 알람도 포함될 수 있다.
   */
  async getMyAlarms(userId: string): Promise<Alarm[]> {
    if (!userId) {
      throw new Error("사용자 정보가 없습니다.");
    }

    const alarmQuery = query(
      collection(db, ALARMS_COLLECTION),
      where("ownerId", "==", userId),
    );

    const snapshot = await getDocs(alarmQuery);

    const alarms = snapshot.docs.map((alarmDoc) =>
      mapAlarmDocument(alarmDoc.id, alarmDoc.data()),
    );

    return alarms.sort((a, b) => a.alarmTime.getTime() - b.alarmTime.getTime());
  },

  /**
   * 내가 생성한 알람 조회
   */
  async getCreatedAlarms(userId: string): Promise<Alarm[]> {
    if (!userId) {
      throw new Error("사용자 정보가 없습니다.");
    }

    const alarmQuery = query(
      collection(db, ALARMS_COLLECTION),
      where("creatorId", "==", userId),
    );

    const snapshot = await getDocs(alarmQuery);

    const alarms = snapshot.docs.map((alarmDoc) =>
      mapAlarmDocument(alarmDoc.id, alarmDoc.data()),
    );

    return alarms.sort((a, b) => a.alarmTime.getTime() - b.alarmTime.getTime());
  },

  /**
   * 친구 알람 조회
   */
  async getFriendAlarms(friendId: string): Promise<Alarm[]> {
    if (!friendId) {
      throw new Error("친구 사용자 정보가 없습니다.");
    }

    const alarmQuery = query(
      collection(db, ALARMS_COLLECTION),
      where("ownerId", "==", friendId),
    );

    const snapshot = await getDocs(alarmQuery);

    const alarms = snapshot.docs.map((alarmDoc) =>
      mapAlarmDocument(alarmDoc.id, alarmDoc.data()),
    );

    return alarms.sort((a, b) => a.alarmTime.getTime() - b.alarmTime.getTime());
  },

  /**
   * 알람 단건 조회
   */
  async getAlarmById(alarmId: string): Promise<Alarm | null> {
    if (!alarmId) {
      throw new Error("알람 ID가 없습니다.");
    }

    const alarmRef = doc(db, ALARMS_COLLECTION, alarmId);
    const alarmDoc = await getDoc(alarmRef);

    if (!alarmDoc.exists()) {
      return null;
    }

    return mapAlarmDocument(alarmDoc.id, alarmDoc.data());
  },

  /**
   * 알람 생성
   *
   * Firestore 저장 후 OS 로컬 알림까지 예약한다.
   */
  async createAlarm(data: CreateAlarmInput): Promise<Alarm> {
    validateCreateAlarmInput(data);

    const docRef = await addDoc(
      collection(db, ALARMS_COLLECTION),
      toFirestoreAlarmData(data),
    );

    const alarm: Alarm = {
      alarmId: docRef.id,
      ...data,
      title: data.title.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      return await scheduleAndSaveNotificationId(alarm);
    } catch (error) {
      await deleteDoc(doc(db, ALARMS_COLLECTION, docRef.id));
      throw error;
    }
  },

  /**
   * 알람 수정
   *
   * 기존 예약 알림을 취소하고 새 정보로 다시 예약한다.
   */
  async updateAlarm(alarmId: string, data: UpdateAlarmInput): Promise<Alarm> {
    if (!alarmId) {
      throw new Error("알람 ID가 없습니다.");
    }

    validateUpdateAlarmInput(data);

    const alarmRef = doc(db, ALARMS_COLLECTION, alarmId);
    const alarmDoc = await getDoc(alarmRef);

    if (!alarmDoc.exists()) {
      throw new Error("알람을 찾을 수 없습니다.");
    }

    const previousAlarm = mapAlarmDocument(alarmDoc.id, alarmDoc.data());

    if (previousAlarm.notificationId) {
      await NotificationService.cancelAlarmNotification(
        previousAlarm.notificationId,
      );
    }

    await updateDoc(alarmRef, toFirestoreUpdateData(data));

    const updatedAlarmDoc = await getDoc(alarmRef);

    if (!updatedAlarmDoc.exists()) {
      throw new Error("수정된 알람을 불러올 수 없습니다.");
    }

    const updatedAlarm = mapAlarmDocument(
      updatedAlarmDoc.id,
      updatedAlarmDoc.data(),
    );

    if (!updatedAlarm.isActive) {
      await updateDoc(alarmRef, {
        notificationId: null,
        updatedAt: serverTimestamp(),
      });

      return {
        ...updatedAlarm,
        notificationId: undefined,
      };
    }

    return scheduleAndSaveNotificationId({
      ...updatedAlarm,
      notificationId: undefined,
    });
  },

  /**
   * 알람 삭제
   *
   * 예약된 알림을 먼저 취소하고 Firestore 문서를 삭제한다.
   */
  async deleteAlarm(alarmId: string): Promise<void> {
    if (!alarmId) {
      throw new Error("알람 ID가 없습니다.");
    }

    const alarmRef = doc(db, ALARMS_COLLECTION, alarmId);
    const alarmDoc = await getDoc(alarmRef);

    if (!alarmDoc.exists()) {
      throw new Error("알람을 찾을 수 없습니다.");
    }

    const alarm = mapAlarmDocument(alarmDoc.id, alarmDoc.data());

    if (alarm.notificationId) {
      await NotificationService.cancelAlarmNotification(alarm.notificationId);
    }

    await deleteDoc(alarmRef);
  },

  /**
   * 알람 활성화 / 비활성화
   *
   * 활성화: 알림 예약
   * 비활성화: 기존 예약 취소
   */
  async toggleAlarm(alarmId: string, isActive: boolean): Promise<Alarm> {
    if (!alarmId) {
      throw new Error("알람 ID가 없습니다.");
    }

    return this.updateAlarm(alarmId, { isActive });
  },

  /**
   * 현재 로그인한 사용자의 활성 알람을 다시 예약한다.
   *
   * 앱 재설치, 앱 데이터 초기화, 알림 ID 유실 상황에서 보정용으로 사용한다.
   * 앱 시작 시 App.tsx에서 한 번 호출한다.
   */
  async syncMyActiveAlarms(userId: string): Promise<void> {
    const alarms = await this.getMyAlarms(userId);

    for (const alarm of alarms) {
      if (!alarm.isActive) {
        continue;
      }

      if (alarm.notificationId) {
        await NotificationService.cancelAlarmNotification(alarm.notificationId);
      }

      const notificationId =
        await NotificationService.scheduleAlarmNotification({
          ...alarm,
          notificationId: undefined,
        });

      await updateDoc(doc(db, ALARMS_COLLECTION, alarm.alarmId), {
        notificationId,
        updatedAt: serverTimestamp(),
      });
    }
  },
};