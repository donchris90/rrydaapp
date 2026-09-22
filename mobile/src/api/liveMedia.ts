import { apiClient } from './client';

// The video the host is sharing in their live. `positionMs` is where the video was
// at `updatedAt` (the SERVER's clock); `serverNow` is the server's clock when this
// was sent, so a phone can work out how far the video has moved since, however
// wrong its own clock is.
export interface LiveMediaState {
  sessionId: string;
  active: true;
  videoId: string;
  title: string;
  url: string;
  status: 'PLAYING' | 'PAUSED';
  positionMs: number;
  updatedAt: number;
  serverNow: number;
}
export interface LiveMediaStopped {
  sessionId: string;
  active: false;
  serverNow: number;
}
export type LiveMediaMessage = LiveMediaState | LiveMediaStopped;

export type LiveMediaAction = 'load' | 'play' | 'pause' | 'seek' | 'sync' | 'stop';

export async function fetchLiveMedia(sessionId: string): Promise<LiveMediaMessage> {
  return (await apiClient.get<LiveMediaMessage>(`/live/${sessionId}/media`)).data;
}

// Host only.
export async function sendLiveMedia(sessionId: string, body: { action: LiveMediaAction; videoId?: string; positionMs?: number }): Promise<LiveMediaMessage> {
  return (await apiClient.post<LiveMediaMessage>(`/live/${sessionId}/media`, body)).data;
}
