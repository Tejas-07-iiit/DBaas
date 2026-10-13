/**
 * @file src/app/dashboard/admin/page.tsx
 * @description Platform Administrator master overview.
 * Guarded by AdminGuard; displays high-level status across platform users, projects, databases, and health.
 */

"use client";

import { AdminGuard } from "@/components/dashboard/AdminGuard";
import { Shield } from "lucide-react";

export default function AdminOverview() {
  return (
    <AdminGuard>
       <div className="animate-in fade-in duration-500 max-w-5xl">
         <h1 className="text-2xl font-bold flex items-center gap-2 mb-8"><Shield size={24} className="text-amber-500"/> Platform Overview</h1>
         <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {['Users', 'Projects', 'Databases', 'System Health'].map(x => (
              <div key={x} className="bg-surface/30 border border-border/50 rounded-xl p-6 h-32 flex flex-col justify-center items-center text-muted">
                 <div>{x}</div>
                 <div className="text-sm opacity-50 mt-2">Unavailable</div>
              </div>
            ))}
         </div>
       </div>
    </AdminGuard>
  );
}