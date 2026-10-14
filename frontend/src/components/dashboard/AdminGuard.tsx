/**
 * @file src/components/dashboard/AdminGuard.tsx
 * @description Authorization guard component for Platform Admin routes.
 * Checks `user.isPlatformAdmin` and shows a friendly "Admins only" screen
 * if the authenticated user lacks platform administration privileges.
 */

"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import Link from "next/link";
import { Shield } from "lucide-react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  
  if (status === 'loading') return null;
  
  if (!user?.isPlatformAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4">
          <Shield size={24} />
        </div>
        <h1 className="text-xl font-bold mb-2 text-text">Platform Admin Restricted</h1>
        <p className="text-muted text-xs max-w-sm mb-6 leading-relaxed">
          You need elevated platform administrator privileges to inspect system-wide clusters and telemetry.
        </p>
        <Link 
          href="/dashboard" 
          className="px-4 py-2 border border-border/60 rounded-lg hover:bg-surface-2 text-text transition-colors font-medium text-xs"
        >
          Return to Overview
        </Link>
      </div>
    );
  }
  
  return <>{children}</>;
}
