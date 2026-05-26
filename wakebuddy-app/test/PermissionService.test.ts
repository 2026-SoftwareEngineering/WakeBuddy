import { Alarm } from "../src/models/Alarm";
import { FriendService } from "../src/services/FriendService";
import { PermissionService } from "../src/services/PermissionService";

jest.mock("../src/services/FriendService", () => ({
  FriendService: {
    isFriend: jest.fn(),
  },
}));

function createTestAlarm(ownerId: string, creatorId: string): Alarm {
  return {
    alarmId: "alarm-1",
    ownerId,
    creatorId,
    title: "테스트 알람",
    alarmTime: new Date(),
    repeatType: "none",
    repeatDays: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("PermissionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("canCreateAlarmForUser", () => {
    test("현재 사용자 정보가 없으면 false를 반환한다.", async () => {
      const result = await PermissionService.canCreateAlarmForUser(
        "",
        "target-user",
      );

      expect(result).toBe(false);
    });

    test("대상 사용자 정보가 없으면 false를 반환한다.", async () => {
      const result = await PermissionService.canCreateAlarmForUser(
        "current-user",
        "",
      );

      expect(result).toBe(false);
    });

    test("본인에게 알람을 생성하는 경우 true를 반환한다.", async () => {
      const result = await PermissionService.canCreateAlarmForUser(
        "user-1",
        "user-1",
      );

      expect(result).toBe(true);
      expect(FriendService.isFriend).not.toHaveBeenCalled();
    });

    test("친구에게 알람을 생성하는 경우 true를 반환한다.", async () => {
      (FriendService.isFriend as jest.Mock).mockResolvedValue(true);

      const result = await PermissionService.canCreateAlarmForUser(
        "user-1",
        "user-2",
      );

      expect(result).toBe(true);
      expect(FriendService.isFriend).toHaveBeenCalledWith("user-1", "user-2");
    });

    test("친구가 아닌 사용자에게 알람을 생성하는 경우 false를 반환한다.", async () => {
      (FriendService.isFriend as jest.Mock).mockResolvedValue(false);

      const result = await PermissionService.canCreateAlarmForUser(
        "user-1",
        "user-3",
      );

      expect(result).toBe(false);
      expect(FriendService.isFriend).toHaveBeenCalledWith("user-1", "user-3");
    });
  });

  describe("canViewAlarm", () => {
    test("알람 대상자는 알람을 조회할 수 있다.", () => {
      const alarm = createTestAlarm("owner-1", "creator-1");

      const result = PermissionService.canViewAlarm("owner-1", alarm);

      expect(result).toBe(true);
    });

    test("알람 생성자는 알람을 조회할 수 있다.", () => {
      const alarm = createTestAlarm("owner-1", "creator-1");

      const result = PermissionService.canViewAlarm("creator-1", alarm);

      expect(result).toBe(true);
    });

    test("알람 대상자도 생성자도 아니면 조회할 수 없다.", () => {
      const alarm = createTestAlarm("owner-1", "creator-1");

      const result = PermissionService.canViewAlarm("other-user", alarm);

      expect(result).toBe(false);
    });
  });

  describe("canEditAlarm", () => {
    test("알람 대상자는 알람을 수정할 수 있다.", () => {
      const alarm = createTestAlarm("owner-1", "creator-1");

      const result = PermissionService.canEditAlarm("owner-1", alarm);

      expect(result).toBe(true);
    });

    test("알람 생성자는 알람을 수정할 수 있다.", () => {
      const alarm = createTestAlarm("owner-1", "creator-1");

      const result = PermissionService.canEditAlarm("creator-1", alarm);

      expect(result).toBe(true);
    });

    test("알람 대상자도 생성자도 아니면 수정할 수 없다.", () => {
      const alarm = createTestAlarm("owner-1", "creator-1");

      const result = PermissionService.canEditAlarm("other-user", alarm);

      expect(result).toBe(false);
    });
  });

  describe("canDeleteAlarm", () => {
    test("알람 대상자는 알람을 삭제할 수 있다.", () => {
      const alarm = createTestAlarm("owner-1", "creator-1");

      const result = PermissionService.canDeleteAlarm("owner-1", alarm);

      expect(result).toBe(true);
    });

    test("알람 생성자는 알람을 삭제할 수 있다.", () => {
      const alarm = createTestAlarm("owner-1", "creator-1");

      const result = PermissionService.canDeleteAlarm("creator-1", alarm);

      expect(result).toBe(true);
    });

    test("알람 대상자도 생성자도 아니면 삭제할 수 없다.", () => {
      const alarm = createTestAlarm("owner-1", "creator-1");

      const result = PermissionService.canDeleteAlarm("other-user", alarm);

      expect(result).toBe(false);
    });
  });
});