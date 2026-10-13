/**
 * @file src/lib/auth/GuestOnly.tsx
 * @description Route wrapper for public-only auth pages (/login, /signup, /forgot-password).
 * Automatically redirects already authenticated users directly to POST_LOGIN_REDIRECT (/dashboard).
 */

"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { env } from '@/config/env';

export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(env.POST_LOGIN_REDIRECT);
    }
  }, [status, router]);

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-8 h-8 border-4 border-surface border-t-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
