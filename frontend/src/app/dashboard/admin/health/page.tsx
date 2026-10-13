/**
 * @file src/app/dashboard/admin/health/page.tsx
 * @description Platform Administrator infrastructure health dashboard.
 * Queries `/admin/system/health` on a 30s polling cycle to monitor core service components.
 */

"use client";

import { AdminGuard } from "@/components/dashboard/AdminGuard";
import { useQuery } from "@tanstack/react-query";
import { getAdminHealth } from "@/lib/api/admin";
import { mapHealthStatus } from "@/lib/api/mappers";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Activity, RefreshCw } from "lucide-react";

export default function AdminHealth() {
  const { data, error, isLoading, refetch, dataUpdatedAt } = useQuery({ queryKey: ["admin_health"], queryFn: async () => { const r: any = await getAdminHealth(); return (r.data || r).map((d: any) => ({ ...d, status: mapHealthStatus(d.status) })); }, refetchInterval: 30000 });

  return (
    <AdminGuard>
       <div className="animate-in fade-in duration-500 max-w-5xl">
         <div className="flex justify-between items-center mb-8">
           <h1 className="text-2xl font-bold flex items-center gap-2"><Activity size={24} className="text-amber-500"/> System Health</h1>
           <div className="flex items-center gap-4">
             {dataUpdatedAt > 0 && <span className="text-xs text-muted">Updated {Math.floor((Date.now() - dataUpdatedAt)/1000)}s ago</span>}
             <button onClick={() => refetch()} disabled={isLoading} className="flex items-center gap-2 px-3 py-1.5 border border-border/50 rounded hover:bg-surface-2 text-sm disabled:opacity-50"><RefreshCw size={14} className={isLoading ? 'animate-spin' : ''}/> Refresh</button>
           </div>
         </div>

         {isLoading ? <div className="p-8 text-center">Loading health...</div> : error ? <ErrorState error={error} /> : (
           <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {data.map((h: any, i: number) => (
                <div key={i} className={`bg-surface/30 border border-border/50 rounded-xl p-6 ${h.status === 'down' ? 'border-red-500/50' : h.status === 'degraded' ? 'border-amber-500/50' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                     <div className="font-bold">{h.name}</div>
                     <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${h.status === 'ok' ? 'bg-[#3FCF6D]/10 text-[#3FCF6D]' : h.status === 'degraded' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>{h.status}</span>
                  </div>
                  <div className="text-sm text-muted mb-4">{h.message || 'Operating normally'}</div>
                  <div className="text-xs text-muted/50 font-mono">Checked {new Date(h.lastChecked).toLocaleTimeString()}</div>
                </div>
              ))}
           </div>
         )}
       </div>
    </AdminGuard>
  );
}