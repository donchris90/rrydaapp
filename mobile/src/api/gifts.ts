import { apiClient } from './client';
import * as Crypto from 'expo-crypto';

export interface Gift {
  id: string;
  code: string;
  name: string;
  coinPrice: number;
  category: string | null;
  // An emoji the app draws for the gift (editable in the admin).
  icon: string | null;
}

export async function fetchGiftCatalog(): Promise<Gift[]> {
  const response = await apiClient.get<Gift[]>('/gifts');
  return response.data;
}

export async function sendGift(params: {
  recipientId: string;
  giftId: string;
  context?: 'LIVE' | 'ROOM' | 'VIDEO';
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

export interface BackpackGift {
  giftId: string;
  code: string | null;
  name: string;
  icon: string | null;
  count: number;
  coinValue: number;
  senders: { userId: string; displayName: string | null; count: number }[];
}

// One day (Nigeria time) of gifts you received. Newest day first; `isToday` marks today.
export interface BackpackDay {
  date: string; // YYYY-MM-DD
  isToday: boolean;
  totalCount: number;
  totalCoins: number;
  gifts: BackpackGift[];
}

export async function fetchBackpack(days = 7): Promise<BackpackDay[]> {
  const response = await apiClient.get<BackpackDay[]>('/gifts/backpack', { params: { days } });
  return response.data;
}
