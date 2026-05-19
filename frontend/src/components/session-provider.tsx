'use client';

import {createContext, ReactNode, useContext, useEffect, useState} from 'react';

import {
  getCurrentUser,
  refreshSession,
  registerPatient,
  requestLoginOtp,
  verifyOtp
} from '@/lib/api';
import {OtpChallengeData, Role, UserProfile} from '@/lib/types';

type SessionState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
};

type SessionContextValue = SessionState & {
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
  logout: () => void;
  refresh: () => Promise<void>;
};

const STORAGE_KEY = 'khalas-session';

const SessionContext = createContext<SessionContextValue | null>(null);

function loadStoredSession(): SessionState {
  if (typeof window === 'undefined') {
    return {accessToken: null, refreshToken: null, user: null};
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return {accessToken: null, refreshToken: null, user: null};
  }

  try {
    return JSON.parse(raw) as SessionState;
  } catch {
    return {accessToken: null, refreshToken: null, user: null};
  }
}

function persistSession(state: SessionState) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!state.accessToken || !state.refreshToken || !state.user) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function SessionProvider({children}: {children: ReactNode}) {
  const [session, setSession] = useState<SessionState>({
    accessToken: null,
    refreshToken: null,
    user: null
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = loadStoredSession();
    setSession(stored);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    persistSession(session);
  }, [isReady, session]);

  async function refresh() {
    if (!session.refreshToken) {
      throw new Error('No refresh token');
    }

    const tokens = await refreshSession(session.refreshToken);
    const nextSession = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      user: tokens.user
    };
    setSession(nextSession);
  }

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

  async function verifyOtpCode(phone: string, otpCode: string) {
    const tokens = await verifyOtp(phone, otpCode);
    const nextSession = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      user: tokens.user
    };
    setSession(nextSession);
    return tokens.user.role;
  }

  function logout() {
    setSession({accessToken: null, refreshToken: null, user: null});
  }

  useEffect(() => {
    if (!isReady || !session.accessToken || session.user) {
      return;
    }

    void getCurrentUser(session.accessToken)
      .then((user) => {
        setSession((current) => ({...current, user}));
      })
      .catch(() => {
        setSession({accessToken: null, refreshToken: null, user: null});
      });
  }, [isReady, session.accessToken, session.user]);

  const value: SessionContextValue = {
    ...session,
    isReady,
    isAuthenticated: Boolean(session.accessToken && session.user),
    register,
    requestOtp,
    verifyOtpCode,
    logout,
    refresh
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
