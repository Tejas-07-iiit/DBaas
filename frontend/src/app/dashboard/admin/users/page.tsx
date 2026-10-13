/**
 * @file src/app/dashboard/admin/users/page.tsx
 * @description Platform Administrator user registry.
 * Queries `/admin/users` to inspect registered platform users.
 */

"use client";

import { AdminGuard } from "@/components/dashboard/AdminGuard";
import { useQuery } from "@tanstack/react-query";
import { getAdminUsers } from "@/lib/api/admin";
import { ErrorState } from "@/components/dashboard/ErrorState";

export default function AdminUsers() {
  const { data, error, isLoading } = useQuery({ queryKey: ["admin_users"], queryFn: async () => { const r: any = await getAdminUsers(1, 100); return r.data || r; } });
  
  return (
    <AdminGuard>
       <div className="animate-in fade-in duration-500 max-w-5xl">
         <h1 className="text-2xl font-bold mb-8">Users</h1>
         {isLoading ? <div className="p-8">Loading...</div> : error ? <ErrorState error={error} /> : (
            <div className="bg-surface/30 border border-border/50 rounded-xl overflow-hidden p-6 text-muted">
               Data loaded (Users). Table UI stubbed for brevity.
            </div>
         )}
       </div>
    </AdminGuard>
  );
}