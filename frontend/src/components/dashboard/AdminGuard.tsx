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
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in">
        <Shield size={48} className="text-amber-500 mb-4 opacity-50" />
        <h1 className="text-2xl font-bold mb-2">Admins only</h1>
        <p className="text-muted mb-6">You need platform administrator privileges to view this area.</p>
        <Link href="/dashboard" className="px-4 py-2 border border-border/50 rounded hover:bg-surface-2 transition-colors font-bold text-sm">Return to Dashboard</Link>
      </div>
    );
  }
  
  return <>{children}</>;
}
