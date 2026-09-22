import { apiClient } from './client';

export type PkStatus = 'CHALLENGED' | 'ACCEPTED' | 'COUNTDOWN' | 'ACTIVE' | 'SETTLED' | 'CANCELLED';

export interface PkBattle {
  id: string;
  challengerId: string;
  opponentId: string;
  status: PkStatus;
  // BigInt on the backend, serialized to string by PkController's
  // toResponse() (Express's JSON serializer throws on raw BigInt) — kept
  // as string here to match exactly, not coerced to number, since PK
  // scores are spec'd to allow values a JS number can't represent exactly.
  scoreChallenger: string;
  scoreOpponent: string;
  startedAt: string | null;
  endsAt: string | null;
  winnerId: string | null;
}

// Challenge a specific person. They must be online (the server checks).
export async function challengePk(opponentId: string): Promise<PkBattle> {
  const response = await apiClient.post<PkBattle>(`/pk/challenge/${opponentId}`);
  return response.data;
}

export async function acceptPk(battleId: string): Promise<PkBattle> {
  const response = await apiClient.post<PkBattle>(`/pk/${battleId}/accept`);
  return response.data;
}

export async function fetchPk(battleId: string): Promise<PkBattle> {
  const response = await apiClient.get<PkBattle>(`/pk/${battleId}`);
  return response.data;
}

// Backs the incoming-challenges list — see pk.service.ts's
// incomingChallenges() comment for why this didn't exist before: a
// challenged user had no way to ever discover the challenge existed.
export async function fetchIncomingPk(): Promise<PkBattle[]> {
  const response = await apiClient.get<PkBattle[]>('/pk/incoming');
  return response.data;
}

export interface ActivePkForHost {
  battle: PkBattle;
  opponentId: string;
  opponentDisplayName: string | null;
  // Null is a real, meaningful state — the battle is active but the
  // opponent isn't currently broadcasting. See pk.service.ts's
  // findActiveForHost() comment.
  opponentSession: { id: string; providerChannel: string; title: string } | null;
}

// The missing link — given whichever host a viewer is currently
// watching, this answers "are they in a PK battle right now, and if so
// what's the opponent's live channel to join too." Real null (not an
// error) when there's no active battle for this host at all.
export async function fetchActivePkForHost(hostId: string): Promise<ActivePkForHost | null> {
  const response = await apiClient.get<ActivePkForHost | null>(`/pk/active-for-host/${hostId}`);
  return response.data;
}

// ── History ──────────────────────────────────────────────────────

export interface PkHistoryEntry {
  id: string;
  opponentId: string;
  opponentDisplayName: string | null;
  // Strings for the same reason PkBattle's scores are (BigInt on the backend).
  myScore: string;
  opponentScore: string;
  result: 'WIN' | 'LOSS' | 'DRAW';
  startedAt: string | null;
  settledAt: string | null;
}

export interface PkHistory {
  record: { wins: number; losses: number; draws: number };
  battles: PkHistoryEntry[];
}

// Newest first. Pass `before` (settledAt of the last row loaded) to page.
export async function fetchPkHistory(params: { limit?: number; before?: string } = {}): Promise<PkHistory> {
  const response = await apiClient.get<PkHistory>('/pk/history', { params });
  return response.data;
}

export type PkCategory = 'friends' | 'agency' | 'random';

export interface PkCandidate {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  // Set when they are broadcasting right now.
  live: { sessionId: string; title: string } | null;
}

// Who can be challenged, ONLINE right now:
//   friends - people you follow who follow you back
//   agency  - creators in your agency
//   random  - creators who are online
export async function fetchPkCandidates(category: PkCategory) {
  const response = await apiClient.get<{ category: PkCategory; onlineCount: number; candidates: PkCandidate[] }>('/pk/candidates', { params: { category } });
  return response.data;
}

// "Random match": the server picks an online creator and challenges them.
export async function randomPk() {
  const response = await apiClient.post<{ battle: PkBattle; opponent: { userId: string; displayName: string | null; avatarUrl: string | null } }>('/pk/random');
  return response.data;
}

export async function declinePk(battleId: string): Promise<PkBattle> {
  const response = await apiClient.post<PkBattle>(`/pk/${battleId}/decline`);
  return response.data;
}
