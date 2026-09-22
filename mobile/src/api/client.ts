import axios from 'axios';
import { API_BASE_URL } from '../config';
import { getRefreshToken, saveRefreshToken, clearRefreshToken } from '../auth/tokenStorage';
import { isDefinitiveAuthRejection, isNetworkError, shouldRetryOnce } from './errors';

// Access tokens live in memory only (never persisted — see tokenStorage.ts
// for why refresh tokens are the ones kept in SecureStore). AuthContext
// calls setAccessToken() whenever it changes (on login, on refresh) and
// setOnAuthFailure() once at startup so this client can trigger a logout
// without importing AuthContext directly — avoids a circular import
// between "the thing that makes API calls" and "the thing that manages
// auth state", which would otherwise need each other.
let accessToken: string | null = null;
let onAuthFailure: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

// Needed by the chat socket connection, which authenticates via a
// handshake auth payload rather than an HTTP header — axios's interceptor
// above doesn't apply to socket.io connections, so the socket hook needs
// its own way to read the current token.
export function getAccessToken(): string | null {
  return accessToken;
}

export function setOnAuthFailure(cb: () => void): void {
  onAuthFailure = cb;
}

// 45 s, not 10: a hosted backend that has been idle can take most of a minute to
// wake, and a short timeout made the first request after a quiet period fail.
export const apiClient = axios.create({ baseURL: API_BASE_URL, timeout: 45000 });

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Concurrent requests can all 401 at once (e.g. a screen firing several
// queries on mount right as the access token expires) — without this
// de-duplication, each would trigger its own refresh call, racing each
// other and burning through refresh-token rotation faster than necessary
// (the backend rotates + invalidates the old refresh token on every use).
let refreshPromise: Promise<string | null> | null = null;

// Resolves to a new access token; to null ONLY when the server refused the refresh
// token (the session really is over); and THROWS when the server simply couldn't be
// reached (asleep, offline) — that must not sign the person out.
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    // Plain axios, not apiClient — must not go through the same
    // request/response interceptors (would recurse into 401 handling).
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
    const newAccessToken: string = response.data.accessToken;
    const newRefreshToken: string = response.data.refreshToken;
    accessToken = newAccessToken;
    await saveRefreshToken(newRefreshToken); // rotation — the backend invalidates the old one on use
    return newAccessToken;
  } catch (e) {
    if (isDefinitiveAuthRejection(e)) return null;
    throw e; // network trouble: keep the session
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Slow or sleeping server: try once more (reads, sign-in and refresh only).
    if (shouldRetryOnce(originalRequest, error)) {
      originalRequest._networkRetried = true;
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return apiClient(originalRequest);
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      let newAccessToken: string | null;
      try {
        newAccessToken = await refreshPromise;
      } catch (refreshError) {
        // Couldn't reach the server to refresh. Not a logout: surface the network error.
        return Promise.reject(isNetworkError(refreshError) ? refreshError : error);
      }

      if (newAccessToken) {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      }

      // Refresh itself failed — the session is genuinely over, not just
      // the access token expiring normally. Clear everything and let
      // AuthContext route back to the login screen.
      await clearRefreshToken();
      accessToken = null;
      onAuthFailure?.();
    }
    return Promise.reject(error);
  },
);
