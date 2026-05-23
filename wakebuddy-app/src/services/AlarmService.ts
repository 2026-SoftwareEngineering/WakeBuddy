import { Alarm } from "../models/Alarm";

// 임시 데이터 (Firebase 연동 전)
let mockAlarms: Alarm[] = [];

export const AlarmService = {
  // 내 알람 조회
  async getMyAlarms(userId: string): Promise<Alarm[]> {
    return mockAlarms.filter((a) => a.ownerId === userId);
  },

  // 친구 알람 조회 (merge 이후 사용)
  async getFriendAlarms(friendId: string): Promise<Alarm[]> {
    return mockAlarms.filter((a) => a.ownerId === friendId);
  },

  // 알람 생성
  async createAlarm(
    alarm: Omit<Alarm, "alarmId" | "createdAt" | "updatedAt">,
  ): Promise<Alarm> {
    // 입력값 검증
    if (!alarm.title) {
      throw new Error("알람 제목을 입력해주세요.");
    }
    if (!alarm.time) {
      throw new Error("알람 시간을 입력해주세요.");
    }

    const newAlarm: Alarm = {
      ...alarm,
      alarmId: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAlarms.push(newAlarm);
    return newAlarm;
  },

  // 알람 수정
  async updateAlarm(
    alarmId: string,
    data: Partial<Pick<Alarm, "title" | "time">>,
  ): Promise<Alarm> {
    const index = mockAlarms.findIndex((a) => a.alarmId === alarmId);
    if (index === -1) {
      throw new Error("알람을 찾을 수 없습니다.");
    }

    // 입력값 검증
    if (data.title !== undefined && !data.title) {
      throw new Error("알람 제목을 입력해주세요.");
    }
    if (data.time !== undefined && !data.time) {
      throw new Error("알람 시간을 입력해주세요.");
    }

    mockAlarms[index] = {
      ...mockAlarms[index],
      ...data,
      updatedAt: new Date(),
    };

    return mockAlarms[index];
  },

  // 알람 삭제
  async deleteAlarm(alarmId: string): Promise<void> {
    const index = mockAlarms.findIndex((a) => a.alarmId === alarmId);
    if (index === -1) {
      throw new Error("알람을 찾을 수 없습니다.");
    }

    mockAlarms.splice(index, 1);
  },

  // 알람 활성화 / 비활성화
  async toggleAlarm(alarmId: string, isActive: boolean): Promise<Alarm> {
    const index = mockAlarms.findIndex((a) => a.alarmId === alarmId);
    if (index === -1) {
      throw new Error("알람을 찾을 수 없습니다.");
    }

    mockAlarms[index] = {
      ...mockAlarms[index],
      isActive,
      updatedAt: new Date(),
    };

    return mockAlarms[index];
  },
};
