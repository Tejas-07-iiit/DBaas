/**
 * @file src/app/dashboard/admin/databases/page.tsx
 * @description Platform Administrator global database registry.
 * Queries `/admin/databases` to inspect all provisioned database instances across all accounts.
 */

"use client";

import { AdminGuard } from "@/components/dashboard/AdminGuard";
import { useQuery } from "@tanstack/react-query";
import { getAdminDatabases } from "@/lib/api/admin";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Database, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AdminDatabases() {
  const { data, error, isLoading } = useQuery({ 
    queryKey: ["admin_databases"], 
    queryFn: async () => { 
      const r: any = await getAdminDatabases(1, 100); 
      return r.data || r; 
    } 
  });

  const dbList = Array.isArray(data) ? data : Array.isArray(data?.databases) ? data.databases : [];
  
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
                <Database size={16} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-text">Global Database Fleet</h1>
                <p className="text-muted text-xs mt-0.5">All provisioned clusters across platform hypervisors</p>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted text-xs">Loading database fleet...</div>
        ) : error ? (
          <ErrorState error={error} />
        ) : dbList.length > 0 ? (
          <div className="bg-surface/50 border border-border/60 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-2 text-muted uppercase text-[10px] font-semibold tracking-wider border-b border-border/40">
                <tr>
                  <th className="px-6 py-3.5">Cluster Instance</th>
                  <th className="px-6 py-3.5">Engine</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {dbList.map((db: any, idx: number) => (
                  <tr key={db.id || idx} className="hover:bg-surface-2/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-text">
                      <div className="flex items-center gap-2">
                        <Database size={14} className="text-accent shrink-0" />
                        <span>{db.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize font-medium text-text">
                      {db.engine}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={db.status || "running"} />
                    </td>
                    <td className="px-6 py-4 text-muted font-mono text-[11px]">
                      {db.createdAt ? new Date(db.createdAt).toLocaleDateString() : "Active"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-surface/50 border border-border/60 rounded-xl p-8 text-center text-muted text-xs">
            No database instances found in global registry.
          </div>
        )}
      </div>
    </AdminGuard>
  );
}