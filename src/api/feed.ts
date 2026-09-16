import { apiClient } from './client';
import type { WalletBalances, FeedUser } from './types';

export async function fetchWallet(): Promise<WalletBalances> {
  const response = await apiClient.get<WalletBalances>('/wallet');
  return response.data;
}

export async function fetchFollowing(): Promise<FeedUser[]> {
  const response = await apiClient.get<FeedUser[]>('/feed/following');
  return response.data;
}

export async function fetchDiscover(): Promise<FeedUser[]> {
  const response = await apiClient.get<FeedUser[]>('/feed/discover');
  return response.data;
}

// Lives here rather than a new social.ts file since it's the same shape
// as the other feed lists and Profile is currently its only caller. Hits
// the social module (not /feed/following) because that's the endpoint
// that actually returns the people following YOU, which /feed has no
// equivalent of.
export async function fetchFollowers(): Promise<FeedUser[]> {
  const response = await apiClient.get<FeedUser[]>('/social/followers');
  return response.data;
}

// Backing HomeScreen's For You / New / Nearby tabs — these three
// endpoints didn't exist on the backend until now; HomeScreen.tsx was
// written expecting them, which meant this project never actually
// compiled before this fix. See feed.service.ts's comments on each for
// exactly what's real: For You is honestly identical to Discover (no
// personalization signal exists yet), New and Nearby are both genuinely
// distinct real queries.
export async function fetchForYou(): Promise<FeedUser[]> {
  const response = await apiClient.get<FeedUser[]>('/feed/for-you');
  return response.data;
}

export async function fetchNew(): Promise<FeedUser[]> {
  const response = await apiClient.get<FeedUser[]>('/feed/new');
  return response.data;
}

export async function fetchNearby(): Promise<FeedUser[]> {
  const response = await apiClient.get<FeedUser[]>('/feed/nearby');
  return response.data;
}
