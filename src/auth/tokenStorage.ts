import * as SecureStore from 'expo-secure-store';

// expo-secure-store uses the OS keychain (iOS) / EncryptedSharedPreferences
// (Android) — appropriate for refresh tokens specifically because they're
// long-lived (30 days per the backend's JWT_REFRESH_EXPIRES_IN) and a leak
// is a bigger deal than a short-lived access token. Access tokens are kept
// in memory only (see AuthContext) — no need to persist something that
// expires in 15 minutes and gets refreshed on every app start anyway.
const REFRESH_TOKEN_KEY = 'refreshToken';

export async function saveRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearRefreshToken(): Promise<void> {
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
