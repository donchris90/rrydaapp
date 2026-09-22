import { apiClient } from './client';

export type MissionMetric = 'LIVE_MINUTES' | 'PK_WINS' | 'GIFT_COINS_RECEIVED' | 'NEW_FOLLOWERS';

export interface Mission {
  id: string;
  code: string;
  title: string;
  description: string;
  metric: MissionMetric;
  target: number;
  // Paid in coins into the BONUS wallet.
  rewardCoins: number;
  // Live progress for today, in the metric's own unit (minutes, wins, coins,
  // followers). May exceed `target`.
  progress: number;
  claimed: boolean;
  claimable: boolean;
}

export interface MissionsToday {
  period: { key: string; start: string; resetsAt: string };
  // Coins, as a string (BigInt on the backend).
  bonusBalance: string;
  missions: Mission[];
}

// Creator-only (403 otherwise). Progress is derived on the server from real
// activity; the client never reports it.
export async function fetchMissions(): Promise<MissionsToday> {
  const response = await apiClient.get<MissionsToday>('/missions');
  return response.data;
}

export async function claimMission(
  missionId: string,
): Promise<{ claimed: true; rewardCoins: number; bonusBalance: string }> {
  const response = await apiClient.post(`/missions/${missionId}/claim`);
  return response.data;
}
