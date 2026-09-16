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

// No matchmaking/random-opponent queue exists on the backend — challenge()
// only supports challenging a specific, known user id. The reference
// app's "Random PK"/"Team PK" modes aren't backed by anything real here;
// only the "Friend PK" (challenge a specific person) shape is buildable
// honestly today.
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
