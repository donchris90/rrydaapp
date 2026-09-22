import type { AppStackParamList } from '../navigation/types';

export interface NotificationRoute {
  name: keyof AppStackParamList;
  params?: Record<string, unknown>;
}

// Where tapping a notification should go. Shared by the inbox rows and by
// phone-push taps (whose `data` is the same type + payload), so both always
// land in the same place. Null means "nothing to open".
export function routeForNotification(
  type: string,
  payload: Record<string, any> | null | undefined,
): NotificationRoute | null {
  const p = payload ?? {};
  switch (type) {
    case 'FOLLOW':
      // FollowList can't open one specific user's profile yet, so this goes
      // to the followers list rather than pretending to.
      return p.followerId ? { name: 'FollowList', params: { mode: 'followers' } } : null;
    case 'MESSAGE':
      return p.senderId ? { name: 'Conversation', params: { userId: p.senderId, displayName: null } } : null;
    case 'PK_CHALLENGE':
    case 'PK_RESULT':
      return { name: 'PkScreen' };
    case 'SEAT_APPROVED':
      return p.roomId ? { name: 'Room', params: { roomId: p.roomId } } : null;
    case 'WITHDRAWAL_UPDATE':
    case 'CREATOR_APPLICATION':
      return { name: 'CreatorCenter' };
    case 'SYSTEM':
      if (p.event === 'video_ready' && p.videoId) return { name: 'VideoFeed', params: { videoId: p.videoId } };
      return null;
    case 'SECURITY':
      if (p.event === 'kyc_approved' || p.event === 'kyc_rejected') return { name: 'Authentication' };
      if (p.event === 'payout_account_added' || p.event === 'payout_account_changed') return { name: 'PayoutAccount' };
      return null;
    case 'MISSED_CALL':
      return p.callerId
        ? { name: 'Conversation', params: { userId: p.callerId, displayName: p.callerDisplayName ?? null } }
        : null;
    default:
      return null;
  }
}
