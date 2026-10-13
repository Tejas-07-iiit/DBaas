/**
 * @file src/lib/auth/AuthProvider.tsx
 * @description Root authentication provider and context for DBaaS.
 * 
 * Supports three authentication modalities:
 * 1. Demo Mode: In-browser simulated session with sample user profile
 * 2. Backend JWT: REST API bearer token auth with automatic refresh
 * 3. Firebase OAuth: Google Identity Provider with fallback linking to backend
 */

"use client";

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { tokenStorage } from './tokenStorage';
import { authApi } from '@/lib/api/auth';
import type { MeResponse, LoginRequest, RegisterRequest } from '@/lib/api/mappers';
// DEMO MODE
import { isDemoEnabled } from './demo/demoConfig';
import { getDemoSession, setDemoSession, clearDemoSession } from './demo/demoSession';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  user: MeResponse | null;
  status: AuthStatus;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const checkSession = useCallback(async () => {
    // DEMO MODE
    if (isDemoEnabled()) {
      const demoUser = getDemoSession();
      if (demoUser) {
        setUser(demoUser as MeResponse);
        setStatus('authenticated');
        return;
      }
    } else {
      clearDemoSession();
    }

    const token = tokenStorage.getAccessToken();
    const source = tokenStorage.getTokenSource();
    if (!token && source !== 'firebase') {
      setStatus('unauthenticated');
      return;
    }

    try {
      const data = await authApi.me();
      setUser(data);
      setStatus('authenticated');
    } catch {
      tokenStorage.clear();
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    if (tokenStorage.getTokenSource() === 'firebase') {
       import('@/lib/firebase/client').then(({ auth }) => {
          import('firebase/auth').then(({ onAuthStateChanged }) => {
             const unsub = onAuthStateChanged(auth, (user) => {
                if (user) checkSession();
                else { setStatus('unauthenticated'); setUser(null); tokenStorage.clear(); }
             });
             return () => unsub();
          });
       });
    } else {
       checkSession();
    }
  }, [checkSession]);

  const loginWithGoogle = async () => {
    const { auth, googleProvider } = await import('@/lib/firebase/client');
    const { signInWithPopup, signInWithRedirect } = await import('firebase/auth');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') {
         await signInWithRedirect(auth, googleProvider);
         return;
      }
      if (err.code === 'auth/popup-closed-by-user') return;
      if (err.code === 'auth/account-exists-with-different-credential') throw new Error("An account exists with a different credential.");
      if (err.code === 'auth/network-request-failed') throw new Error("Network request failed.");
      throw err;
    }
    
    tokenStorage.setTokenSource('firebase');
    // Try to call me. If 404 or 401, auto-register
    try {
       const user = await authApi.me();
       setUser(user);
       setStatus('authenticated');
    } catch (err: any) {
       if (err.status === 404 || err.status === 401) {
          const user = auth.currentUser;
          if (user) {
             await authApi.register({ email: user.email!, password: "", name: user.displayName || user.email!.split('@')[0] });
             const newUser = await authApi.me();
             setUser(newUser);
             setStatus('authenticated');
          }
       } else {
          throw err;
       }
    }
  };

  const login = async (data: LoginRequest) => {
    tokenStorage.setTokenSource('backend');
    // DEMO MODE
    if (isDemoEnabled() && data.email === process.env.NEXT_PUBLIC_DEMO_EMAIL && data.password === process.env.NEXT_PUBLIC_DEMO_PASSWORD) {
      const session = setDemoSession(data.email);
      if (session) {
        setUser(session as MeResponse);
        setStatus('authenticated');
        return;
      }
    }

    const res = await authApi.login(data);
    const access = res.accessToken;
    const refresh = res.refreshToken;
    if (access) {
      tokenStorage.setTokens(access, refresh);
      await checkSession();
    }
  };

  const register = async (data: RegisterRequest) => {
    tokenStorage.setTokenSource('backend');
    const res = await authApi.register(data);
    const access = res.accessToken;
    const refresh = res.refreshToken;
    if (access) {
      tokenStorage.setTokens(access, refresh);
      await checkSession();
    }
  };

  const logout = async () => {
    if (tokenStorage.getTokenSource() === 'firebase') {
       try {
         const { auth } = await import('@/lib/firebase/client');
         await auth.signOut();
       } catch {}
    }
    // DEMO MODE
    if (getDemoSession()) {
      clearDemoSession();
      setUser(null);
      setStatus('unauthenticated');
      return;
    }

    try {
      await authApi.logout();
    } catch {} // ignore failure, clear locally anyway
    
    tokenStorage.clear();
    setUser(null);
    setStatus('unauthenticated');
  };

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
