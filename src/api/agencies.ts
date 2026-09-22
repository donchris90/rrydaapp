import { apiClient } from './client';
import type { AgencyMembership } from './types';
import type { CreatorPeriod } from './creators';

// GET /agencies/me returns null when the creator isn't in an agency —
// see agencies.service.ts's myMembership().
export async function fetchMyAgency(): Promise<AgencyMembership | null> {
  const response = await apiClient.get<AgencyMembership | null>('/agencies/me');
  return response.data;
}

export interface AgencyDashboard {
  agency: { id: string; name: string; status: string };
  period: CreatorPeriod;
  since: string;
  // Coins, as strings (BigInt on the backend).
  withdrawableBalance: string;
  commissionCoins: string;
  memberCount: number;
  // Gross gift coins received by current members over the period.
  memberGiftCoins: number;
  members: {
    creatorId: string;
    displayName: string | null;
    commissionBps: number;
    joinedAt: string;
    giftCoins: number;
  }[];
}

// The caller's own agency as its owner. Null when they own no agency — a
// normal state, not an error (mirrors fetchMyAgency).
export async function fetchAgencyDashboard(period: CreatorPeriod = 'week'): Promise<AgencyDashboard | null> {
  const response = await apiClient.get<AgencyDashboard | null>('/agencies/me/dashboard', { params: { period } });
  return response.data;
}
