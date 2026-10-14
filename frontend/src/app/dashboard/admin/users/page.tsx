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
import { Users, ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";

export default function AdminUsers() {
  const { data, error, isLoading } = useQuery({ 
    queryKey: ["admin_users"], 
    queryFn: async () => { 
      const r: any = await getAdminUsers(1, 100); 
      return r.data || r; 
    } 
  });

  const usersList = Array.isArray(data) ? data : Array.isArray(data?.users) ? data.users : [];
  
  return (
    <AdminGuard>
      <div className="max-w-5xl space-y-6">
        <div>
          <Link
            href="/dashboard/admin"
            className="text-muted hover:text-text flex items-center gap-1.5 text-xs font-medium transition-colors mb-4"
          >
            <ArrowLeft size={14} /> 
            <span>Back to Platform Admin</span>
          </Link>

          <div className="flex items-center justify-between pb-2 border-b border-border/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Users size={16} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-text">Platform Users</h1>
                <p className="text-muted text-xs mt-0.5">All registered tenant accounts and identity profiles</p>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted text-xs">Loading user registry...</div>
        ) : error ? (
          <ErrorState error={error} />
        ) : usersList.length > 0 ? (
          <div className="bg-surface/50 border border-border/60 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-2 text-muted uppercase text-[10px] font-semibold tracking-wider border-b border-border/40">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Platform Role</th>
                  <th className="px-6 py-3.5">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {usersList.map((u: any, idx: number) => (
                  <tr key={u.id || idx} className="hover:bg-surface-2/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-text">
                      {u.name || "User"}
                    </td>
                    <td className="px-6 py-4 font-mono text-muted text-[11px]">
                      {u.email}
                    </td>
                    <td className="px-6 py-4">
                      {u.isPlatformAdmin ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/30 text-[10px] font-semibold uppercase">
                          Platform Admin
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-surface-2 text-muted border border-border/60 text-[10px] font-semibold uppercase">
                          Standard Tenant
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted font-mono text-[11px]">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Active"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-surface/50 border border-border/60 rounded-xl p-8 text-center text-muted text-xs">
            No registered users found in database registry.
          </div>
        )}
      </div>
    </AdminGuard>
  );
}