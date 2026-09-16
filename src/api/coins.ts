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
  [key: string]: unknown;
}

export async function fetchCoinPackages(countryCode: string): Promise<CoinPackage[]> {
  const response = await apiClient.get<CoinPackage[]>('/coins/packages', { params: { countryCode } });
  return response.data;
}

export async function purchaseCoins(packageId: string, idempotencyKey: string): Promise<CoinPurchaseResult> {
  const response = await apiClient.post<CoinPurchaseResult>('/coins/purchase', { packageId, idempotencyKey });
  return response.data;
}
