/**
 * @file src/app/dashboard/admin/projects/page.tsx
 * @description Platform Administrator global projects directory.
 * Queries `/admin/projects` to monitor workspace projects created across the platform.
 */

"use client";

import { AdminGuard } from "@/components/dashboard/AdminGuard";
import { useQuery } from "@tanstack/react-query";
import { getAdminProjects } from "@/lib/api/admin";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { FolderKanban, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AdminProjects() {
  const { data, error, isLoading } = useQuery({ 
    queryKey: ["admin_projects"], 
    queryFn: async () => { 
      const r: any = await getAdminProjects(1, 100); 
      return r.data || r; 
    } 
  });

  const projList = Array.isArray(data) ? data : Array.isArray(data?.projects) ? data.projects : [];
  
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
                <FolderKanban size={16} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-text">Global Projects Directory</h1>
                <p className="text-muted text-xs mt-0.5">All multi-tenant project workspaces across platform</p>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted text-xs">Loading projects directory...</div>
        ) : error ? (
          <ErrorState error={error} />
        ) : projList.length > 0 ? (
          <div className="bg-surface/50 border border-border/60 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-2 text-muted uppercase text-[10px] font-semibold tracking-wider border-b border-border/40">
                <tr>
                  <th className="px-6 py-3.5">Project Name</th>
                  <th className="px-6 py-3.5">Identifier</th>
                  <th className="px-6 py-3.5">Created</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {projList.map((p: any, idx: number) => (
                  <tr key={p.id || idx} className="hover:bg-surface-2/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-text">
                      <Link href={`/dashboard/projects/${p.id}`} className="hover:text-accent hover:underline flex items-center gap-2">
                        <FolderKanban size={14} className="text-accent shrink-0" />
                        <span>{p.name}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-mono text-muted text-[11px]">
                      {p.id}
                    </td>
                    <td className="px-6 py-4 text-muted font-mono text-[11px]">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "Active"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/dashboard/projects/${p.id}`} 
                        className="px-2.5 py-1.5 rounded-md hover:bg-surface-2 text-accent font-semibold text-xs inline-flex items-center gap-1"
                      >
                        <span>Inspect</span>
                        <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-surface/50 border border-border/60 rounded-xl p-8 text-center text-muted text-xs">
            No projects found in global registry.
          </div>
        )}
      </div>
    </AdminGuard>
  );
}