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

const ALARMS_COLLECTION = "alarms";

/**
 * Firestore Timestamp 또는 Date 값을 앱에서 사용하는 Date 타입으로 변환한다.
 *
 * Firestore에는 날짜/시간이 Timestamp로 저장될 수 있고,
 * 앱 내부에서는 Date로 다루는 것이 편하므로 변환 함수로 분리한다.
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
 *
 * Firestore 문서 id는 alarmId로 사용하고,
 * 문서 안의 날짜/시간 필드는 Date 타입으로 변환한다.
 */
function mapAlarmDocument(alarmId: string, data: any): Alarm {
  return {
    alarmId,
    ownerId: data.ownerId ?? "",
    creatorId: data.creatorId ?? "",
    title: data.title ?? "",
    alarmDate: toDate(data.alarmDate),
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
 * 알람 생성 시 필요한 필수 입력값을 검증한다.
 *
 * createAlarm은 alarmDate, alarmTime이 반드시 필요하므로
 * undefined 상태에서 getTime()을 호출하지 않도록 먼저 존재 여부를 확인한다.
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

  if (!data.alarmDate) {
    throw new Error("알람 날짜를 선택해주세요.");
  }

  if (Number.isNaN(data.alarmDate.getTime())) {
    throw new Error("알람 날짜가 올바르지 않습니다.");
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
 * 알람 수정 시 입력값을 검증한다.
 *
 * updateAlarm은 일부 필드만 수정할 수 있으므로,
 * 값이 들어온 필드에 대해서만 검증한다.
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
 * 앱의 알람 생성 입력값을 Firestore에 저장 가능한 형태로 변환한다.
 *
 * Date 타입은 Firestore Timestamp로 변환해서 저장한다.
 */
function toFirestoreAlarmData(data: CreateAlarmInput) {
  return {
    ownerId: data.ownerId,
    creatorId: data.creatorId,
    title: data.title.trim(),
    alarmDate: Timestamp.fromDate(data.alarmDate),
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
 * 앱의 알람 수정 입력값을 Firestore 업데이트 데이터로 변환한다.
 *
 * Partial 타입이므로 전달된 필드만 updateData에 넣는다.
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

    return alarms.sort(
      (a, b) => a.alarmTime.getTime() - b.alarmTime.getTime(),
    );
  },

  /**
   * 친구 알람 조회
   *
   * ownerId가 친구 uid와 같은 알람을 조회한다.
   * 친구 알람 기능 구현 시 사용한다.
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

    return alarms.sort(
      (a, b) => a.alarmTime.getTime() - b.alarmTime.getTime(),
    );
  },

  /**
   * 알람 단건 조회
   *
   * 알람 수정 화면에서 기존 알람 정보를 불러올 때 사용한다.
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
   * Firestore alarms 컬렉션에 새 알람을 저장한다.
   * NotificationService 연동 후에는 알림 예약 후 notificationId도 함께 저장할 예정이다.
   */
  async createAlarm(data: CreateAlarmInput): Promise<Alarm> {
    validateCreateAlarmInput(data);

    const docRef = await addDoc(
      collection(db, ALARMS_COLLECTION),
      toFirestoreAlarmData(data),
    );

    return {
      alarmId: docRef.id,
      ...data,
      title: data.title.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  /**
   * 알람 수정
   *
   * 제목, 날짜, 시간, 반복 설정, 활성화 여부 등을 수정한다.
   * NotificationService 연동 후에는 시간이나 반복 설정 변경 시 알림 재예약도 함께 처리할 예정이다.
   */
  async updateAlarm(
    alarmId: string,
    data: UpdateAlarmInput,
  ): Promise<Alarm> {
    if (!alarmId) {
      throw new Error("알람 ID가 없습니다.");
    }

    validateUpdateAlarmInput(data);

    const alarmRef = doc(db, ALARMS_COLLECTION, alarmId);
    const alarmDoc = await getDoc(alarmRef);

    if (!alarmDoc.exists()) {
      throw new Error("알람을 찾을 수 없습니다.");
    }

    await updateDoc(alarmRef, toFirestoreUpdateData(data));

    const updatedAlarmDoc = await getDoc(alarmRef);

    if (!updatedAlarmDoc.exists()) {
      throw new Error("수정된 알람을 불러올 수 없습니다.");
    }

    return mapAlarmDocument(updatedAlarmDoc.id, updatedAlarmDoc.data());
  },

  /**
   * 알람 삭제
   *
   * Firestore에서 해당 알람 문서를 삭제한다.
   * NotificationService 연동 후에는 삭제 전에 예약된 알림도 취소해야 한다.
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

    await deleteDoc(alarmRef);
  },

  /**
   * 알람 활성화 / 비활성화
   *
   * isActive 값을 변경한다.
   * NotificationService 연동 후에는 활성화 시 알림 예약,
   * 비활성화 시 알림 취소를 함께 처리한다.
   */
  async toggleAlarm(alarmId: string, isActive: boolean): Promise<Alarm> {
    if (!alarmId) {
      throw new Error("알람 ID가 없습니다.");
    }

    return this.updateAlarm(alarmId, { isActive });
  },
};