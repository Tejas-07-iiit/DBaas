/**
 * @file src/lib/auth/AuthGuard.tsx
 * @description Route protection wrapper for authenticated pages (e.g. /dashboard/*).
 * Automatically redirects unauthenticated visitors to `/login?next=<currentPath>`,
 * while presenting a centered spinner during initial session verification.
 */

"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      const next = encodeURIComponent(pathname);
      router.replace(`/login?next=${next}`);
    }
  }, [status, router, pathname]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-8 h-8 border-4 border-surface border-t-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
