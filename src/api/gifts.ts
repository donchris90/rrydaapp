import { apiClient } from './client';
import * as Crypto from 'expo-crypto';

export interface Gift {
  id: string;
  code: string;
  name: string;
  coinPrice: number;
  category: string | null;
}

export async function fetchGiftCatalog(): Promise<Gift[]> {
  const response = await apiClient.get<Gift[]>('/gifts');
  return response.data;
}

export async function sendGift(params: {
  recipientId: string;
  giftId: string;
  context?: 'LIVE' | 'ROOM';
  contextId?: string;
}): Promise<{ id: string }> {
  const response = await apiClient.post('/gifts/send', {
    ...params,
    idempotencyKey: Crypto.randomUUID(),
  });
  return response.data;
}

export interface ReceivedGift {
  giftId: string;
  giftName: string;
  giftCode: string;
  count: number;
  totalCoinValue: number;
}

export async function fetchReceivedGifts(): Promise<ReceivedGift[]> {
  const response = await apiClient.get<ReceivedGift[]>('/gifts/received');
  return response.data;
}
