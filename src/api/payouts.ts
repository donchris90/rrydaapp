import { apiClient } from './client';

export interface PayoutProvider {
  id: 'PAYSTACK' | 'STRIPE';
  name: string;
  description: string;
  available: boolean;
  comingSoon: boolean;
}

// The rules an admin has set for your country, or why you can't withdraw yet.
export type PayoutConfig =
  | { available: false; reason: 'NOT_CONFIGURED' | 'DISABLED'; currencyCode?: string }
  | {
      available: true;
      currencyCode: string;
      minorPer100Coins: number; // cash paid for 100 coins, in minor units
      minWithdrawalCoins: number;
      maxWithdrawalCoins: number | null;
      feeBps: number; // 100 = 1%
      feeFlatMinor: number;
      // Must you have passed identity verification to withdraw?
      requireKyc: boolean;
    };

export interface PayoutQuote {
  currencyCode: string;
  coins: number;
  grossMinor: number;
  feeMinor: number;
  netMinor: number;
}

export interface Bank {
  code: string;
  name: string;
}

export interface PayoutAccount {
  provider: string;
  bankName: string;
  accountLast4: string;
  accountName: string;
  currencyCode: string;
  updatedAt: string;
  // Changing the account is blocked for 24h after it was set or changed.
  canChangeAt: string;
}

export const fetchPayoutProviders = async () => (await apiClient.get<PayoutProvider[]>('/payout/providers')).data;
export const fetchPayoutConfig = async () => (await apiClient.get<PayoutConfig>('/payout/config')).data;
// Computed by the server so the app never duplicates the money math.
export const fetchPayoutQuote = async (coins: number) => (await apiClient.get<PayoutQuote>('/payout/quote', { params: { coins } })).data;
export const fetchBanks = async () => (await apiClient.get<Bank[]>('/payout/banks')).data;
export const fetchPayoutAccount = async () => (await apiClient.get<PayoutAccount | null>('/payout/account')).data;
export const resolvePayoutAccount = async (bankCode: string, accountNumber: string) =>
  (await apiClient.post<{ accountName: string }>('/payout/account/resolve', { bankCode, accountNumber })).data;
export const savePayoutAccount = async (input: { bankCode: string; accountNumber: string; password: string }) =>
  (await apiClient.put<PayoutAccount>('/payout/account', input)).data;
