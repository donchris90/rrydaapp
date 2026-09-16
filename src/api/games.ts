import { apiClient } from './client';

export interface GameRound {
  id: string;
  gameCode: string;
  entryPrice: number;
  openAt: string;
  lockAt: string;
  result: { dice?: number[]; sum?: number } | null;
  status: 'SCHEDULED' | 'OPEN' | 'LOCKED' | 'RESOLVING' | 'SETTLED' | 'CANCELLED';
  settledAt: string | null;
}

export interface GameEntry {
  id: string;
  roundId: string;
  selection: number[];
  coinAmount: number;
  rewardAmount: number;
  status: 'PLACED' | 'WON' | 'LOST' | 'REFUNDED';
  cashedOutMultiplier?: number | null;
}

export async function fetchRounds(gameCode: string): Promise<GameRound[]> {
  const response = await apiClient.get<GameRound[]>(`/games/${gameCode}/rounds`);
  return response.data;
}

export async function fetchRound(roundId: string): Promise<GameRound> {
  const response = await apiClient.get<GameRound>(`/games/rounds/${roundId}`);
  return response.data;
}

export async function placeEntry(
  roundId: string,
  params: { selection: number[]; stakeAmount: number; idempotencyKey: string; autoCashoutMultiplier?: number },
): Promise<GameEntry> {
  const response = await apiClient.post<GameEntry>(`/games/rounds/${roundId}/entries`, params);
  return response.data;
}

export async function fetchPool(roundId: string): Promise<{ applicable: boolean; pool: Record<string, number> }> {
  const response = await apiClient.get(`/games/rounds/${roundId}/pool`);
  return response.data;
}

// Real settled reward for the round just watched — see games.controller.ts's
// myEntries(). Used for the win banner's "My Prize" amount instead of
// recomputing the payout multiplier on the client.
export async function fetchMyEntries(roundId: string): Promise<GameEntry[]> {
  const response = await apiClient.get<GameEntry[]>(`/games/rounds/${roundId}/entries/mine`);
  return response.data;
}

export interface GameHistoryRow {
  roundId: string;
  settledAt: string | null;
  result: { dice?: number[]; sum?: number } | null;
  winners: number;
  prize: number;
  players: number;
  totalWagered: number;
}

export async function fetchHistory(gameCode: string): Promise<GameHistoryRow[]> {
  const response = await apiClient.get<GameHistoryRow[]>(`/games/${gameCode}/history`);
  return response.data;
}

// S/B/E/O sequence for the last 30 settled rounds — see games.controller.ts's
// stats() for why this is purely descriptive (never fed back into the RNG).
export interface ResultClassification {
  size: 'S' | 'B';
  parity: 'E' | 'O';
}

export async function fetchStats(gameCode: string): Promise<{ applicable: boolean; sequence?: ResultClassification[] }> {
  const response = await apiClient.get(`/games/${gameCode}/stats`);
  return response.data;
}

// Crash-specific — real server-authoritative status, never a client-side
// timer or guess. status: 'LIVE' means the round is currently climbing;
// multiplier is null once CRASHED until settlement writes the official
// result (see CrashService.getStatus's own comment on that brief race).
export interface CrashStatus {
  status: 'SCHEDULED' | 'OPEN' | 'LIVE' | 'CRASHED';
  multiplier: number | null;
}

export async function fetchCrashStatus(roundId: string): Promise<CrashStatus> {
  const response = await apiClient.get<CrashStatus>(`/games/rounds/${roundId}/multiplier`);
  return response.data;
}

// The one live, human-timed decision in this whole game — everything
// else resolves automatically at settlement. Never sends a client-side
// multiplier; the server computes the real elapsed time itself.
export async function cashOutCrash(roundId: string): Promise<GameEntry> {
  const response = await apiClient.post<GameEntry>(`/games/rounds/${roundId}/cashout`);
  return response.data;
}
