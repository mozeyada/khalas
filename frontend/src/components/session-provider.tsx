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
import {ApiError, registerPatient, requestLoginOtp} from '@/lib/api';

type SessionContextValue = {
  user: UserProfile | null;
  isReady: boolean;
  isAuthenticated: boolean;
  register: (input: {
    phone: string;
    name_ar: string;
    name_en: string;
    email?: string;
  }) => Promise<OtpChallengeData>;
  requestOtp: (phone: string) => Promise<OtpChallengeData>;
  verifyOtpCode: (phone: string, otpCode: string) => Promise<Role>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isReady, setIsReady] = useState(false);

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
    email?: string;
  }) {
    return registerPatient(input);
  }

  async function requestOtp(phone: string) {
    return requestLoginOtp(phone);
  }

  async function verifyOtpCode(phone: string, otpCode: string): Promise<Role> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({phone, otp_code: otpCode}),
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
