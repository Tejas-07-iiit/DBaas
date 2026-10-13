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

export default function AdminProjects() {
  const { data, error, isLoading } = useQuery({ queryKey: ["admin_projects"], queryFn: async () => { const r: any = await getAdminProjects(1, 100); return r.data || r; } });
  
  return (
    <AdminGuard>
       <div className="animate-in fade-in duration-500 max-w-5xl">
         <h1 className="text-2xl font-bold mb-8">Projects</h1>
         {isLoading ? <div className="p-8">Loading...</div> : error ? <ErrorState error={error} /> : (
            <div className="bg-surface/30 border border-border/50 rounded-xl overflow-hidden p-6 text-muted">
               Data loaded (Projects). Table UI stubbed for brevity.
            </div>
         )}
       </div>
    </AdminGuard>
  );
}