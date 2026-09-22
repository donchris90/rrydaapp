import { apiClient } from './client';

export interface CoinPackage {
  id: string;
  coinAmount: number;
  price: string; // client-ready display string (already formatted with currency)
  priceMinor: number;
  currencyCode: string;
}

export interface CoinPurchaseResult {
  id: string;
  status: string;
  providerRef?: string;
  // The provider's payment page. Open it to pay; null when payments are not set up.
  checkoutUrl?: string | null;
  [key: string]: unknown;
}

export async function fetchCoinPackages(_countryCode?: string): Promise<CoinPackage[]> {
  const response = await apiClient.get<CoinPackage[]>('/coins/packages');
  return response.data;
}

export async function purchaseCoins(packageId: string, idempotencyKey: string): Promise<CoinPurchaseResult> {
  const response = await apiClient.post<CoinPurchaseResult>('/coins/purchase', { packageId, idempotencyKey });
  return response.data;
}

export interface PaymentMethod {
  id: 'PAYSTACK' | 'CRYPTO' | 'C2C';
  name: string;
  description: string;
  available: boolean;
  comingSoon: boolean;
}

export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  const response = await apiClient.get<PaymentMethod[]>('/coins/payment-methods');
  return response.data;
}

// What the (signature-verified) payment webhook has recorded — the app can only
// read this, never mark a purchase paid.
export async function fetchPurchaseStatus(id: string): Promise<{ id: string; status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED' | 'CHARGEBACK'; coinAmount: number }> {
  const response = await apiClient.get(`/coins/purchases/${id}`);
  return response.data;
}


export type WalletTransactionType =
  | 'COIN_PURCHASE' | 'GIFT_SENT' | 'GIFT_RECEIVED' | 'GAME_ENTRY' | 'GAME_REWARD'
  | 'WITHDRAWAL' | 'WITHDRAWAL_RELEASE' | 'REFUND' | 'CHARGEBACK' | 'BONUS'
  | 'ADJUSTMENT' | 'AGENCY_COMMISSION' | 'PK_SCORE' | 'C2C_ESCROW' | 'C2C_RELEASE' | 'C2C_REFUND';

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  amount: string;
  balanceAfter: string | null;
  reference: string | null;
  createdAt: string;
}

export async function fetchWalletTransactions(params?: {
  walletType?: 'COIN' | 'CREATOR_EARNINGS' | 'AGENCY_EARNINGS' | 'BONUS';
  limit?: number;
  before?: string;
}) {
  const response = await apiClient.get<{
    walletType: string;
    balance: string;
    currencyCode: string;
    items: WalletTransaction[];
    nextBefore: string | null;
  }>('/wallet/transactions', { params });
  return response.data;
}
