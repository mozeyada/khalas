'use client';

/**
 * Session management using the BFF (Backend-for-Frontend) pattern.
 *
 * Tokens (access + refresh) are stored exclusively in HttpOnly cookies set by
 * the Next.js API routes under /api/auth/. This component never reads, writes,
 * or stores any token in JavaScript-accessible storage (localStorage,
 * sessionStorage, or React state).
 *
 * The only client-side state is the user profile object which carries no
 * credentials.
 */

import {createContext, ReactNode, useCallback, useContext, useEffect, useState} from 'react';

import {OtpChallengeData, Role, UserProfile} from '@/lib/types';
import {ApiError, registerAccount, requestLoginOtp} from '@/lib/api';

type SessionContextValue = {
  user: UserProfile | null;
  isReady: boolean;
  isAuthenticated: boolean;
  register: (input: {
    phone: string;
    name_ar: string;
    name_en: string;
    role?: 'patient' | 'provider';
    provider_type?: 'doctor' | 'clinic';
    email?: string;
    preferred_channel?: 'email' | 'whatsapp';
    password?: string;
  }) => Promise<OtpChallengeData>;
  requestOtp: (identifier: string) => Promise<OtpChallengeData>;
  verifyOtpCode: (identifier: string, otpCode: string) => Promise<Role>;
  loginWithPassword: (identifier: string, password: string) => Promise<Role>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync role to HTML root for CSS theme switching
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', user ? user.role : 'patient');
    }
  }, [user]);

  /**
   * On mount, attempt to fetch the current user via the BFF /me route.
   * If the HttpOnly cookie is present and valid, the user is restored.
   * If not (expired or absent), the session is treated as unauthenticated.
   */
  useEffect(() => {
    void fetch('/api/auth/me', {cache: 'no-store'})
      .then(async (res) => {
        if (!res.ok) {
          // Cookie absent or expired – try silent refresh
          const refreshRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            cache: 'no-store',
          });
          if (!refreshRes.ok) {
            setUser(null);
            return;
          }
          const refreshData = (await refreshRes.json()) as {data: {user: UserProfile}};
          setUser(refreshData.data.user);
          return;
        }
        const data = (await res.json()) as {data: UserProfile};
        setUser(data.data);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setIsReady(true);
      });
  }, []);

  async function register(input: {
    phone: string;
    name_ar: string;
    name_en: string;
    role?: 'patient' | 'provider';
    provider_type?: 'doctor' | 'clinic';
    email?: string;
    preferred_channel?: 'email' | 'whatsapp';
    password?: string;
  }) {
    return registerAccount({ ...input, role: input.role || 'patient' });
  }

  async function requestOtp(identifier: string) {
    return requestLoginOtp(identifier);
  }

  async function verifyOtpCode(identifier: string, otpCode: string): Promise<Role> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({identifier, otp_code: otpCode}),
    });
    if (!res.ok) {
      const body = (await res.json()) as {error?: string};
      throw new ApiError(body.error ?? 'Login failed.', res.status);
    }
    const data = (await res.json()) as {data: {user: UserProfile}};
    setUser(data.data.user);
    return data.data.user.role;
  }

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', {method: 'POST'});
    // Clear client state and force a full page reload to flush any cached
    // sensitive views per session lifecycle requirements.
    setUser(null);
    window.location.href = '/';
  }, []);

  const loginWithPassword = useCallback(
    async (identifier: string, password: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/auth/login-password', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({identifier, password}),
        });

        const payload = (await res.json()) as {error?: string; data?: {user: UserProfile}};
        if (!res.ok || !payload.data) {
          throw new Error(payload.error ?? 'Invalid login credentials.');
        }

        setUser(payload.data.user);
        return payload.data.user.role;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed.');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const refresh = useCallback(async () => {
    const res = await fetch('/api/auth/refresh', {method: 'POST', cache: 'no-store'});
    if (!res.ok) {
      throw new Error('Token refresh failed.');
    }
    const data = (await res.json()) as {data: {user: UserProfile}};
    setUser(data.data.user);
  }, []);

  const value: SessionContextValue = {
    user,
    isReady,
    isAuthenticated: Boolean(user),
    register,
    requestOtp,
    verifyOtpCode,
    loginWithPassword,
    logout,
    refresh,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}
