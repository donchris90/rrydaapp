import { apiClient } from './client';

export interface Profile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  countryCode: string | null;
  verified: boolean;
  followerCount: number;
  followingCount: number;
  isMe: boolean;
  isFollowing: boolean;
  // Set while they are broadcasting.
  live: { sessionId: string; title: string } | null;
}

export const fetchProfile = async (userId: string) => (await apiClient.get<Profile>(`/profiles/${userId}`)).data;

// Tells the person their profile was viewed (once a day per visitor, in their inbox).
export const recordProfileView = async (userId: string) => (await apiClient.post<{ recorded: boolean }>(`/profiles/${userId}/view`)).data;
