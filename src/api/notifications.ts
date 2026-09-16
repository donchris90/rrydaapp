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
