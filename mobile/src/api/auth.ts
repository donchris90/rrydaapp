import { apiClient } from './client';
import type { AuthResponse, CurrentUser, Referral } from './types';

export async function register(params: {
  email: string;
  password: string;
  countryCode: string;
  displayName?: string;
  referralCode?: string;
}): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/register', params);
  return response.data;
}

export async function login(params: { email: string; password: string }): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', params);
  return response.data;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', { refreshToken });
}

export async function fetchMe(): Promise<CurrentUser> {
  const response = await apiClient.get<CurrentUser>('/users/me');
  return response.data;
}

export async function updateDisplayName(displayName: string): Promise<CurrentUser> {
  const response = await apiClient.patch<CurrentUser>('/users/me', { displayName });
  return response.data;
}

export async function updateAvatarUrl(avatarUrl: string): Promise<CurrentUser> {
  const response = await apiClient.patch<CurrentUser>('/users/me', { avatarUrl });
  return response.data;
}

export async function updateBio(bio: string): Promise<CurrentUser> {
  // A blank bio clears it on the server.
  const response = await apiClient.patch<CurrentUser>('/users/me', { bio });
  return response.data;
}

export async function fetchMyReferrals(): Promise<Referral[]> {
  const response = await apiClient.get<Referral[]>('/users/me/referrals');
  return response.data;
}

export interface CheckInStatus {
  streak: number;
  alreadyCheckedInToday: boolean;
  nextRewardCoins: number;
  // Coins for streak days 1..7 (day 7 onwards pays the cap). Optional so the
  // app still works against a backend that predates the field.
  rewardSchedule?: number[];
}

export interface CheckInResult {
  streak: number;
  rewardCoins: number;
}

export async function fetchCheckInStatus(): Promise<CheckInStatus> {
  const response = await apiClient.get<CheckInStatus>('/users/me/check-in');
  return response.data;
}

export async function performCheckIn(): Promise<CheckInResult> {
  const response = await apiClient.post<CheckInResult>('/users/me/check-in');
  return response.data;
}
