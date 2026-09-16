import { apiClient } from './client';
import type { HonorRankingEntry } from './types';

// economy.controller.ts's GiftController#ranking — real gift totals, see
// GiftService.ranking. Backs Home's "Honor" banner + HonorRankingScreen.
export async function fetchHonorRanking(period: 'today' | 'week'): Promise<HonorRankingEntry[]> {
  const response = await apiClient.get<HonorRankingEntry[]>('/gifts/ranking', { params: { period } });
  return response.data;
}
