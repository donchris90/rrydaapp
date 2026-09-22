import { apiClient } from './client';

export interface CreatorApplication {
  id: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason?: string | null;
  reviewedAt?: string | null;
  [key: string]: unknown;
}

export type CreatorPeriod = 'today' | 'week' | 'month' | 'all';

// Rolling lookback windows on the backend (today = last 24h, week = 7d,
// month = 30d), all derived from existing rows — see
// creator-analytics.service.ts.
export interface CreatorDashboard {
  period: CreatorPeriod;
  since: string;
  // Coins, as a string (BigInt on the backend).
  withdrawableBalance: string;
  live: { seconds: number; sessions: number; likes: number; peakViewers: number };
  followers: { total: number; gained: number };
  gifts: {
    count: number;
    // Gross coins senders paid for gifts sent to this creator.
    coins: number;
    topGifters: { userId: string; displayName: string | null; coins: number }[];
  };
  // The creator's own share, after the platform (and any agency) split.
  earnings: { creatorCoins: string };
  pk: { wins: number; losses: number; draws: number };
  // Days this calendar month with at least `thresholdMinutes` live in total.
  // Independent of `period`.
  validDays: { count: number; thresholdMinutes: number; month: string };
}

export interface CreatorLeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string | null;
  countryCode: string;
  giftCoins: number;
  followers: number;
  pkWins: number;
  isMe: boolean;
}

export type WithdrawableWallet = 'CREATOR_EARNINGS' | 'AGENCY_EARNINGS';

export interface WithdrawalRequest {
  id: string;
  status: string;
  amountCoins: number;
  currencyCode: string;
  [key: string]: unknown;
}

export type WithdrawalStatus = 'PENDING_REVIEW' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REJECTED';

// One row of GET /withdrawals/mine. Internal review flags and provider
// references are never sent to the requester.
export interface WithdrawalHistoryEntry {
  id: string;
  walletType: WithdrawableWallet;
  amountCoins: number;
  currencyCode: string;
  // Cash after fees, and where it was sent (null on requests made before payout accounts existed).
  feeMinor: number | null;
  netMinor: number | null;
  bankName: string | null;
  accountLast4: string | null;
  status: WithdrawalStatus;
  requestedAt: string;
  decidedAt: string | null;
  // Only set for FAILED / REJECTED.
  failureReason: string | null;
}

export async function applyToBeCreator(): Promise<CreatorApplication> {
  const response = await apiClient.post<CreatorApplication>('/creators/apply');
  return response.data;
}

export async function fetchCreatorDashboard(period: CreatorPeriod = 'week'): Promise<CreatorDashboard> {
  const response = await apiClient.get<CreatorDashboard>('/creators/dashboard', { params: { period } });
  return response.data;
}

export async function fetchCreatorLeaderboard(period: CreatorPeriod = 'today'): Promise<CreatorLeaderboardEntry[]> {
  const response = await apiClient.get<CreatorLeaderboardEntry[]>('/creators/leaderboard', { params: { period } });
  return response.data;
}

// `walletType` defaults to the creator wallet; an approved agency owner can
// pass 'AGENCY_EARNINGS' to withdraw agency commission.
export async function requestWithdrawal(
  amountCoins: number,
  currencyCode: string,
  idempotencyKey: string,
  walletType: WithdrawableWallet = 'CREATOR_EARNINGS',
): Promise<WithdrawalRequest> {
  const response = await apiClient.post<WithdrawalRequest>('/withdrawals', { amountCoins, currencyCode, idempotencyKey, walletType });
  return response.data;
}

// Newest first. Pass `before` (requestedAt of the last row loaded) to page.
export async function fetchMyWithdrawals(
  params: { walletType?: WithdrawableWallet; limit?: number; before?: string } = {},
): Promise<WithdrawalHistoryEntry[]> {
  const response = await apiClient.get<WithdrawalHistoryEntry[]>('/withdrawals/mine', { params });
  return response.data;
}
