import { apiClient } from './client';
import type { LiveNowSession } from './types';

export async function fetchLiveNow(): Promise<LiveNowSession[]> {
  const response = await apiClient.get<LiveNowSession[] | { sessions?: LiveNowSession[]; live?: LiveNowSession[] }>('/feed/live-now');
  const data: any = response.data;
  return Array.isArray(data)
    ? data
    : Array.isArray(data?.sessions)
      ? data.sessions
      : Array.isArray(data?.live)
        ? data.live
        : [];
}

export interface LiveSessionRaw {
  id: string;
  hostId: string;
  title: string;
  category: string | null;
  countryCode: string;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED';
  startedAt: string | null;
  endedAt: string | null;
  providerChannel: string;
  themeColor: string | null;
  likeCount: number;
  peakViewerCount: number;
  durationSeconds: number | null;
}

export async function createLiveSession(params: {
  title: string;
  category?: string;
  themeColor?: string;
  // https URL of an uploaded cover image (see api/uploads.ts).
  coverUrl?: string;
}): Promise<{ session: LiveSessionRaw; token: string }> {
  const response = await apiClient.post('/live', params);
  return response.data;
}

export async function endLiveSession(sessionId: string): Promise<LiveSessionRaw> {
  const response = await apiClient.post<LiveSessionRaw>(`/live/${sessionId}/end`);
  return response.data;
}

export async function fetchMyLiveSession(): Promise<LiveSessionRaw | null> {
  const response = await apiClient.get(`/live/mine`);
  return response.data;
}

export async function joinLiveSession(
  sessionId: string
): Promise<{ session: LiveSessionRaw; token: string }> {
  const response = await apiClient.post(`/live/${sessionId}/join`);
  return response.data;
}

// ── Viewers ──────────────────────────────────────────────────────

export interface LiveViewer {
  userId: string;
  displayName: string | null;
  joinedAt: string;
}

export async function fetchLiveViewers(sessionId: string): Promise<LiveViewer[]> {
  const response = await apiClient.get<LiveViewer[] | { viewers?: LiveViewer[] }>(`/live/${sessionId}/viewers`);
  const data: any = response.data;
  return Array.isArray(data)
    ? data
    : Array.isArray(data?.viewers)
      ? data.viewers
      : [];
}

export async function leaveLiveSession(sessionId: string): Promise<void> {
  await apiClient.post(`/live/${sessionId}/leave`);
}

export interface WatchHistoryEntry {
  sessionId: string;
  title: string;
  hostDisplayName: string | null;
  status: string;
  watchedAt: string;
}

export async function fetchWatchHistory(): Promise<WatchHistoryEntry[]> {
  const response = await apiClient.get<WatchHistoryEntry[] | { history?: WatchHistoryEntry[] }>(`/live/history`);
  const data: any = response.data;
  return Array.isArray(data)
    ? data
    : Array.isArray(data?.history)
      ? data.history
      : [];
}

// ── Likes, summary, chat history ─────────────────────────────────

export interface LiveSummary {
  id: string;
  hostId: string;
  title: string;
  category: string | null;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED';
  startedAt: string | null;
  endedAt: string | null;
  likeCount: number;
  viewerCount: number;
  peakViewerCount: number;
  totalViewerCount: number;
  durationSeconds: number | null;
  // What the broadcast earned the host: gifts sent inside the session.
  giftCount: number;
  giftCoins: number;
  newFollowers: number;
  topGifters: { userId: string; displayName: string | null; avatarUrl: string | null; coins: number }[];
}

export async function fetchLiveSummary(sessionId: string): Promise<LiveSummary> {
  const response = await apiClient.get<LiveSummary>(`/live/${sessionId}/summary`);
  return response.data;
}

// `count` batches several rapid taps into one request (server clamps 1–20).
export async function likeLiveSession(sessionId: string, count = 1): Promise<{ likeCount: number }> {
  const response = await apiClient.post<{ likeCount: number }>(`/live/${sessionId}/like`, { count });
  return response.data;
}

export interface ChatHistoryItem {
  id: string;
  senderId: string;
  senderName: string | null;
  content: string;
  createdAt: string;
}

// Oldest-first, ready to render. Pass `before` (createdAt of the oldest
// message on screen) to page further back.
export async function fetchChatHistory(
  context: 'LIVE' | 'ROOM',
  contextId: string,
  params: { limit?: number; before?: string } = {},
): Promise<ChatHistoryItem[]> {
  const base = context === 'LIVE' ? `/live/${contextId}/chat` : `/rooms/${contextId}/chat`;
  const response = await apiClient.get<ChatHistoryItem[] | { messages?: ChatHistoryItem[]; items?: ChatHistoryItem[] }>(base, { params });
  const data: any = response.data;
  const rows = Array.isArray(data)
    ? data
    : Array.isArray(data?.messages)
      ? data.messages
      : Array.isArray(data?.items)
        ? data.items
        : [];
  return rows.filter((item: any) =>
    item && typeof item.id === 'string' &&
    typeof item.senderId === 'string' &&
    typeof item.content === 'string'
  ).map((item: any) => ({
    id: item.id,
    senderId: item.senderId,
    senderName: typeof item.senderName === 'string' ? item.senderName : null,
    content: item.content,
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date(0).toISOString(),
  }));
}
