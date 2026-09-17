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
}

export async function createLiveSession(params: {
  title: string;
  category?: string;
  themeColor?: string;
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