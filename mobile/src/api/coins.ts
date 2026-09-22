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
