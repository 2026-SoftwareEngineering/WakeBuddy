import { Alarm } from "../models/Alarm";
import { FriendService } from "./FriendService";

export const PermissionService = {
  /**
   * 친구에게 알람을 생성할 수 있는지 확인한다.
   *
   * 조건:
   * - 자기 자신에게 알람 생성은 가능
   * - 다른 사용자에게 알람 생성은 친구 관계일 때만 가능
   */
  async canCreateAlarmForUser(
    currentUserId: string,
    targetUserId: string,
  ): Promise<boolean> {
    if (!currentUserId || !targetUserId) {
      return false;
    }

    if (currentUserId === targetUserId) {
      return true;
    }

    return FriendService.isFriend(currentUserId, targetUserId);
  },

  /**
   * 알람 조회 권한 확인
   *
   * 조건:
   * - 알람 대상자(owner)
   * - 알람 생성자(creator)
   */
  canViewAlarm(currentUserId: string, alarm: Alarm): boolean {
    return (
      currentUserId === alarm.ownerId || currentUserId === alarm.creatorId
    );
  },

  /**
   * 알람 수정 권한 확인
   *
   * 현재 설계에서는 알람 대상자와 생성자가 수정 가능하다.
   */
  canEditAlarm(currentUserId: string, alarm: Alarm): boolean {
    return (
      currentUserId === alarm.ownerId || currentUserId === alarm.creatorId
    );
  },

  /**
   * 알람 삭제 권한 확인
   *
   * 현재 설계에서는 본인에게 설정된 알람은 삭제 가능하고,
   * 생성자도 자신이 만든 알람을 삭제할 수 있도록 한다.
   */
  canDeleteAlarm(currentUserId: string, alarm: Alarm): boolean {
    return (
      currentUserId === alarm.ownerId || currentUserId === alarm.creatorId
    );
  },
};