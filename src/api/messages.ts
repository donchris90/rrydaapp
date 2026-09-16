import { apiClient } from './client';

export interface DirectMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface DmConversation {
  userId: string;
  displayName: string | null;
  lastMessage: string;
  lastMessageAt: string;
  lastMessageIsMine: boolean;
  unreadCount: number;
}

export async function sendDirectMessage(recipientId: string, content: string): Promise<DirectMessage> {
  const response = await apiClient.post<DirectMessage>('/messages', { recipientId, content });
  return response.data;
}

export async function fetchConversations(): Promise<DmConversation[]> {
  const response = await apiClient.get<DmConversation[]>('/messages/conversations');
  return response.data;
}

export async function fetchConversation(otherUserId: string): Promise<DirectMessage[]> {
  const response = await apiClient.get<DirectMessage[]>(`/messages/with/${otherUserId}`);
  return response.data;
}

export async function markConversationRead(otherUserId: string): Promise<void> {
  await apiClient.patch(`/messages/with/${otherUserId}/read`);
}
