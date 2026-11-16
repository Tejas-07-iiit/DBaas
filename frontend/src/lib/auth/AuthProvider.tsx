/**
 * @file src/lib/auth/AuthProvider.tsx
 * @description Root authentication provider and context for DBaaS.
 * 
 * Supports:
 * 1. Firebase Email & Password authentication
 * 2. Firebase OAuth (Google and GitHub)
 * 3. Local Development / Demo Mode bypass (dev-token)
 * 4. Token synchronization with NestJS backend (/users/me)
 */

"use client";

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { tokenStorage } from './tokenStorage';
import { authApi } from '@/lib/api/auth';
import type { MeResponse, LoginRequest, RegisterRequest } from '@/lib/api/mappers';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithPopup, 
  signInWithRedirect, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider, githubProvider, isFirebaseConfigured } from '@/lib/firebase/client';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextType {
  user: MeResponse | null;
  status: AuthStatus;
  isFirebaseConfigured: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const syncBackendUser = useCallback(async (shouldThrow = false): Promise<MeResponse | null> => {
    try {
      const data = await authApi.me();
      setUser(data);
      setStatus('authenticated');
      return data;
    } catch (err) {
      tokenStorage.clear();
      setUser(null);
      setStatus('unauthenticated');
      if (shouldThrow) throw err;
      return null;
    }
  }, []);

  const checkSession = useCallback(async () => {
    const token = tokenStorage.getAccessToken();
    const source = tokenStorage.getTokenSource();

    if (!token && source !== 'firebase') {
      setStatus('unauthenticated');
      return;
    }

    if (source === 'firebase' && isFirebaseConfigured) {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const freshToken = await currentUser.getIdToken();
        tokenStorage.setTokens(freshToken);
        await syncBackendUser();
        return;
      }
    }

    await syncBackendUser();
  }, [syncBackendUser]);

  useEffect(() => {
    if (isFirebaseConfigured) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          try {
            tokenStorage.setTokenSource('firebase');
            const token = await firebaseUser.getIdToken();
            tokenStorage.setTokens(token);
            await syncBackendUser();
          } catch {
            tokenStorage.clear();
            setUser(null);
            setStatus('unauthenticated');
          }
        } else {
          // No active Firebase user
          if (tokenStorage.getTokenSource() === 'firebase') {
            tokenStorage.clear();
            setUser(null);
            setStatus('unauthenticated');
          } else {
            // Might be dev-token or demo mode
            await checkSession();
          }
        }
      });

      return () => unsubscribe();
    } else {
      // Firebase not configured, fallback to backend/dev-token session check
      checkSession();
    }
  }, [checkSession, syncBackendUser]);

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      throw new Error("Firebase is not configured. Please set NEXT_PUBLIC_FIREBASE_* environment variables.");
    }

    try {
      const credential = await signInWithPopup(auth, googleProvider);
      tokenStorage.setTokenSource('firebase');
      const token = await credential.user.getIdToken();
      tokenStorage.setTokens(token);
      await syncBackendUser(true);
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return;
      }
      throw err;
    }
  };

  const loginWithGithub = async () => {
    if (!isFirebaseConfigured) {
      throw new Error("Firebase is not configured. Please set NEXT_PUBLIC_FIREBASE_* environment variables.");
    }

    try {
      const credential = await signInWithPopup(auth, githubProvider);
      tokenStorage.setTokenSource('firebase');
      const token = await credential.user.getIdToken();
      tokenStorage.setTokens(token);
      await syncBackendUser(true);
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, githubProvider);
        return;
      }
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return;
      }
      throw err;
    }
  };

  const login = async (data: LoginRequest) => {
    // In local development, check demo credentials or dev fallback first
    const isDemoCreds =
      Boolean(process.env.NEXT_PUBLIC_DEMO_EMAIL) &&
      data.email === process.env.NEXT_PUBLIC_DEMO_EMAIL &&
      data.password === process.env.NEXT_PUBLIC_DEMO_PASSWORD;
    const isDevFallback = !isFirebaseConfigured && process.env.NODE_ENV !== 'production';

    if (isDemoCreds || isDevFallback) {
      tokenStorage.setTokenSource('backend');
      tokenStorage.setTokens('dev-token', 'dev-refresh-token');
      try {
        await syncBackendUser(true);
        return;
      } catch {
        const fallbackUser: MeResponse = {
          id: 'dev-user-001',
          name: 'Developer Admin',
          email: data.email || 'demo@dbaas.dev',
          role: 'ADMIN',
          isPlatformAdmin: true,
        };
        setUser(fallbackUser);
        setStatus('authenticated');
        return;
      }
    }

    if (isFirebaseConfigured) {
      if (!data.password) {
        throw new Error("Password is required");
      }
      const credential = await signInWithEmailAndPassword(auth, data.email, data.password);
      tokenStorage.setTokenSource('firebase');
      const token = await credential.user.getIdToken();
      tokenStorage.setTokens(token);
      await syncBackendUser(true);
      return;
    }

    // Backend endpoint fallback
    const res = await authApi.login(data);
    const access = res.accessToken;
    const refresh = res.refreshToken;
    if (access) {
      tokenStorage.setTokenSource('backend');
      tokenStorage.setTokens(access, refresh);
      await syncBackendUser(true);
    }
  };

  const register = async (data: RegisterRequest) => {
    const isDevFallback = !isFirebaseConfigured && process.env.NODE_ENV !== 'production';

    if (isDevFallback) {
      tokenStorage.setTokenSource('backend');
      tokenStorage.setTokens('dev-token', 'dev-refresh-token');
      try {
        await syncBackendUser(true);
        return;
      } catch {
        const fallbackUser: MeResponse = {
          id: 'dev-user-001',
          name: data.name || 'Developer Admin',
          email: data.email,
          role: 'ADMIN',
          isPlatformAdmin: true,
        };
        setUser(fallbackUser);
        setStatus('authenticated');
        return;
      }
    }

    if (isFirebaseConfigured) {
      if (!data.password) {
        throw new Error("Password is required");
      }
      const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      if (data.name) {
        try {
          await updateProfile(credential.user, { displayName: data.name });
        } catch {}
      }
      tokenStorage.setTokenSource('firebase');
      const token = await credential.user.getIdToken();
      tokenStorage.setTokens(token);
      // The backend will automatically create the user in the database on GET /users/me
      await syncBackendUser(true);
      return;
    }

    // Backend endpoint fallback
    const res = await authApi.register(data);
    const access = res.accessToken;
    const refresh = res.refreshToken;
    if (access) {
      tokenStorage.setTokenSource('backend');
      tokenStorage.setTokens(access, refresh);
      await syncBackendUser();
    }
  };

  const sendPasswordReset = async (email: string) => {
    if (isFirebaseConfigured) {
      await sendPasswordResetEmail(auth, email);
      return;
    }
    await authApi.forgotPassword({ email });
  };

  const logout = async () => {
    if (isFirebaseConfigured) {
      try {
        await signOut(auth);
      } catch {}
    }

    try {
      if (tokenStorage.getAccessToken() !== 'dev-token') {
        await authApi.logout();
      }
    } catch {}

    tokenStorage.clear();
    setUser(null);
    setStatus('unauthenticated');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        isFirebaseConfigured,
        login,
        register,
        loginWithGoogle,
        loginWithGithub,
        sendPasswordReset,
        logout,
      }}
    >
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
