import { apiClient } from './client';

export interface AppNotification {
  id: string;
  type: string;
  payload: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

export async function fetchNotifications(unreadOnly = false): Promise<AppNotification[]> {
  const response = await apiClient.get<AppNotification[]>('/notifications', { params: { unreadOnly } });
  return response.data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch('/notifications/read-all');
}

// Cheap counts for the tab-bar badge. `notifications` excludes MESSAGE-type
// rows (each DM also creates one), so a message is never counted twice.
export interface UnreadCounts {
  notifications: number;
  messages: number;
  total: number;
}

export async function fetchUnreadCounts(): Promise<UnreadCounts> {
  const response = await apiClient.get<UnreadCounts>('/notifications/unread-count');
  return response.data;
}

// Phone push. Registration is keyed by token on the server, so calling this
// on every app start is fine.
export async function registerPushToken(token: string, platform: string): Promise<void> {
  await apiClient.post('/notifications/push-token', { token, platform });
}

export async function unregisterPushToken(token: string): Promise<void> {
  await apiClient.delete('/notifications/push-token', { data: { token } });
}
