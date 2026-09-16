import { apiClient } from './client';

export interface CreatorApplication {
  id: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason?: string | null;
  reviewedAt?: string | null;
  [key: string]: unknown;
}

export interface CreatorDashboard {
  // Only the withdrawable balance is real today — see
  // creators.controller.ts's dashboard() comment: live hours, viewers,
  // followers-gained, and gift-breakdown analytics aren't built yet.
  withdrawableBalance: string;
}

export interface WithdrawalRequest {
  id: string;
  status: string;
  amountCoins: number;
  currencyCode: string;
  [key: string]: unknown;
}

export async function applyToBeCreator(): Promise<CreatorApplication> {
  const response = await apiClient.post<CreatorApplication>('/creators/apply');
  return response.data;
}

export async function fetchCreatorDashboard(): Promise<CreatorDashboard> {
  const response = await apiClient.get<CreatorDashboard>('/creators/dashboard');
  return response.data;
}

export async function requestWithdrawal(amountCoins: number, currencyCode: string, idempotencyKey: string): Promise<WithdrawalRequest> {
  const response = await apiClient.post<WithdrawalRequest>('/withdrawals', { amountCoins, currencyCode, idempotencyKey });
  return response.data;
}
