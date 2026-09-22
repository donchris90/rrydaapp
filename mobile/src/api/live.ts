import { apiClient } from './client';
import type { LiveNowSession } from './types';

export async function fetchLiveNow(): Promise<LiveNowSession[]> {
  const response = await apiClient.get<LiveNowSession[]>('/feed/live-now');
  return response.data;
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
  dailyTargetCoins: number | null;
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
  dailyTargetCoins?: number;
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
  const response = await apiClient.get<LiveViewer[]>(`/live/${sessionId}/viewers`);
  return response.data;
}

export async function kickLiveViewer(sessionId: string, userId: string): Promise<void> {
  await apiClient.post(`/live/${sessionId}/kick/${userId}`);
}

export async function muteLiveViewer(sessionId: string, userId: string): Promise<void> {
  await apiClient.post(`/live/${sessionId}/mute/${userId}`);
}

export async function unmuteLiveViewer(sessionId: string, userId: string): Promise<void> {
  await apiClient.post(`/live/${sessionId}/unmute/${userId}`);
}

export async function banLiveViewer(sessionId: string, userId: string): Promise<void> {
  await apiClient.post(`/live/${sessionId}/ban/${userId}`);
}

export async function unbanLiveViewer(sessionId: string, userId: string): Promise<void> {
  await apiClient.post(`/live/${sessionId}/unban/${userId}`);
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
  const response = await apiClient.get<WatchHistoryEntry[]>('/live/history');
  return response.data;
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
  const response = await apiClient.get<ChatHistoryItem[]>(base, { params });
  return response.data;
}
