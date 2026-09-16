import { apiClient } from './client';
import type { FeedUser, SocialStats } from './types';

// social.controller.ts's follow/followers/stats routes existed with no
// mobile caller until now (ProfileScreen's stat row + the follower/
// following list screens).
export async function fetchSocialStats(): Promise<SocialStats> {
  const response = await apiClient.get<SocialStats>('/social/stats');
  return response.data;
}

export async function fetchFollowingList(): Promise<FeedUser[]> {
  const response = await apiClient.get<FeedUser[]>('/social/following');
  return response.data;
}

export async function fetchFollowersList(): Promise<FeedUser[]> {
  const response = await apiClient.get<FeedUser[]>('/social/followers');
  return response.data;
}

export async function followUser(userId: string): Promise<void> {
  await apiClient.post(`/social/follow/${userId}`);
}

export async function unfollowUser(userId: string): Promise<void> {
  await apiClient.delete(`/social/follow/${userId}`);
}
