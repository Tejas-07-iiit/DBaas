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
import { Activity, RefreshCw, ArrowLeft, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import Link from "next/link";

export default function AdminHealth() {
  const { data, error, isLoading, refetch, dataUpdatedAt } = useQuery({ 
    queryKey: ["admin_health"], 
    queryFn: async () => { 
      const r: any = await getAdminHealth(); 
      return (r.data || r).map((d: any) => ({ ...d, status: mapHealthStatus(d.status) })); 
    }, 
    refetchInterval: 30000 
  });

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

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Activity size={16} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-text">System Infrastructure Health</h1>
                <p className="text-muted text-xs mt-0.5">Real-time health monitors across compute, storage, and API services</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {dataUpdatedAt > 0 && (
                <span className="text-[11px] font-mono text-muted">
                  Checked {Math.floor((Date.now() - dataUpdatedAt)/1000)}s ago
                </span>
              )}
              <button 
                onClick={() => refetch()} 
                disabled={isLoading} 
                className="flex items-center gap-1.5 px-3 py-1.5 border border-border/60 rounded-lg hover:bg-surface-2 text-text text-xs font-medium disabled:opacity-40 transition-colors"
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''}/> 
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted text-xs">Polling infrastructure health endpoints...</div>
        ) : error ? (
          <ErrorState error={error} />
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {data.map((h: any, i: number) => {
              const isOk = h.status === 'ok';
              const isDegraded = h.status === 'degraded';
              
              const borderClass = isOk 
                ? 'border-border/60 hover:border-emerald-500/40' 
                : isDegraded 
                ? 'border-amber-500/50 bg-amber-500/5' 
                : 'border-red-500/50 bg-red-500/5';

              return (
                <div key={i} className={`bg-surface/50 border rounded-xl p-5 space-y-3 transition-colors ${borderClass}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="font-semibold text-sm text-text">{h.name}</div>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                      isOk 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                        : isDegraded 
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}>
                      {h.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted leading-relaxed">{h.message || 'Operating normally with zero error rates'}</div>
                  <div className="text-[10px] text-muted/60 font-mono pt-2 border-t border-border/30">
                    Inspected {new Date(h.lastChecked).toLocaleTimeString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminGuard>
  );
}