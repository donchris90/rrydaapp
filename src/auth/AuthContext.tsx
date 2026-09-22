import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiClient, setAccessToken, setOnAuthFailure } from '../api/client';
import { getRefreshToken, saveRefreshToken, clearRefreshToken } from './tokenStorage';
import * as authApi from '../api/auth';
import { unregisterCurrentPushToken } from '../push/pushRegistration';
import type { CurrentUser } from '../api/types';

interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean; // true only during the initial silent-login attempt on app start
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (params: { email: string; password: string; countryCode: string; displayName?: string; referralCode?: string }) => Promise<void>;
  logout: () => Promise<void>;
  // Re-fetches /users/me and updates the cached user — added so a screen
  // that changes something about the user (e.g. displayName) can make
  // that change visible everywhere else in the app immediately, without
  // requiring a full app restart.
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(null);

  const applyAuthResult = useCallback(async (result: { accessToken: string; refreshToken: string }) => {
    setAccessToken(result.accessToken);
    await saveRefreshToken(result.refreshToken);
    setRefreshTokenValue(result.refreshToken);
    const me = await authApi.fetchMe();
    setUser(me);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setRefreshTokenValue(null);
  }, []);

  // Registers the API client's 401-after-refresh-failure callback exactly
  // once. Deliberately not a dependency of applyAuthResult/clearSession
  // closures being stale — clearSession itself never changes identity
  // (useCallback with no deps), so this is safe as a one-time effect.
  useEffect(() => {
    setOnAuthFailure(() => {
      clearSession();
    });
  }, [clearSession]);

  // Silent re-login on app start: if a refresh token is already stored
  // from a previous session, use it to get a fresh access token without
  // making the user log in again. This is the ONLY place the refresh
  // endpoint is called directly rather than relying on client.ts's 401
  // interceptor — at startup there's no failed request to retry yet.
  useEffect(() => {
    let cancelled = false;

    // Never leave the entire app behind the startup spinner if SecureStore
    // or the API is unavailable. A mobile app must fail open to the login
    // screen rather than appearing frozen forever.
    const startupTimeout = setTimeout(() => {
      if (!cancelled) {
        clearSession();
        setIsLoading(false);
      }
    }, 12000);

    (async () => {
      try {
        const stored = await getRefreshToken();
        if (!stored) {
          if (!cancelled) setIsLoading(false);
          return;
        }

        try {
          const refreshResponse = await apiClient.post('/auth/refresh', { refreshToken: stored });
          await applyAuthResult(refreshResponse.data);
        } catch {
          // Stored refresh token is invalid/expired/already used, or the
          // backend is unavailable. Treat the session as signed out so the
          // app remains usable instead of hanging on the splash spinner.
          await clearRefreshToken();
          clearSession();
        }
      } catch {
        clearSession();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(startupTimeout);
    };
  }, [applyAuthResult, clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await authApi.login({ email, password });
      await applyAuthResult(result);
    },
    [applyAuthResult],
  );

  const register = useCallback(
    async (params: { email: string; password: string; countryCode: string; displayName?: string; referralCode?: string }) => {
      const result = await authApi.register(params);
      await applyAuthResult(result);
    },
    [applyAuthResult],
  );

  const logout = useCallback(async () => {
    // First, while the session is still valid: stop this device receiving the
    // signed-out account's push notifications.
    await unregisterCurrentPushToken();
    if (refreshTokenValue) {
      try {
        await authApi.logout(refreshTokenValue);
      } catch {
        // Best-effort — even if the server call fails (e.g. offline), the
        // local session must still clear. A token the server didn't
        // manage to revoke server-side just sits unused; it can't be
        // replayed to do anything since the client no longer has it.
      }
    }
    await clearRefreshToken();
    clearSession();
  }, [refreshTokenValue, clearSession]);

  const refreshUser = useCallback(async () => {
    const me = await authApi.fetchMe();
    setUser(me);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
