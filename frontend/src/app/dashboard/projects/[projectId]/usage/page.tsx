/**
 * @file src/app/dashboard/projects/[projectId]/usage/page.tsx
 * @description Project resource allocation and quota usage metrics.
 * Compares current database instance counts, vCPUs, RAM, and disk storage against subscription limits.
 */

"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { listDatabases } from "@/lib/api/databases";
import { getSubscription } from "@/lib/api/subscription";
import { mapDatabase, mapSubscription } from "@/lib/api/mappers";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Activity, Database, Cpu, Layers, HardDrive, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function UsagePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  
  const dbQuery = useQuery({ queryKey: ["databases", projectId], queryFn: async () => { const r: any = await listDatabases(projectId); return (r.data || r).map(mapDatabase); } });
  const subQuery = useQuery({ queryKey: ["subscription"], queryFn: async () => { const r: any = await getSubscription(); return mapSubscription(r.data || r); } });

  if (dbQuery.isLoading || subQuery.isLoading) return <div className="p-8 text-center text-muted text-xs">Loading resource telemetry...</div>;
  if (dbQuery.error || subQuery.error) return <ErrorState error={dbQuery.error || subQuery.error} />;

  const databases = dbQuery.data || [];
  const limits = subQuery.data?.limits || {};

  const allocated = {
    databases: databases.length,
    cpu: databases.reduce((acc: number, db: any) => acc + db.cpu, 0),
    memoryMb: databases.reduce((acc: number, db: any) => acc + db.memoryMb, 0),
    storageGb: databases.reduce((acc: number, db: any) => acc + db.storageGb, 0)
  };

  const Bar = ({ label, used, limit, icon: Icon, unit }: { label: string, used: number, limit: number | undefined, icon: any, unit?: string }) => {
    if (!limit) {
      return (
        <div className="bg-surface/50 p-5 border border-border/60 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted">
              <Icon size={16} className="text-accent" />
              <span className="text-xs font-semibold text-text">{label}</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-2 text-muted">Unlimited</span>
          </div>
          <div className="text-xl font-bold font-mono text-text">
            {used} <span className="text-xs font-normal text-muted">{unit || "allocated"}</span>
          </div>
        </div>
      );
    }
    
    const pct = Math.min(100, Math.round((used / limit) * 100));
    let color = 'bg-accent';
    if (pct >= 100) color = 'bg-red-500';
    else if (pct >= 80) color = 'bg-amber-500';

    return (
      <div className="bg-surface/50 p-5 border border-border/60 rounded-xl space-y-3">
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <Icon size={15} className="text-accent" />
            <span className="font-semibold text-text">{label}</span>
          </div>
          <span className="font-mono text-muted text-[11px]">{used} / {limit} ({pct}%)</span>
        </div>
        <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }}></div>
        </div>
        <div className="flex justify-between text-[10px] text-muted font-mono">
          <span>{pct}% capacity utilized</span>
          <span>{limit - used > 0 ? `${limit - used} available` : "Limit reached"}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="pb-2 border-b border-border/30">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-text">Resource Quotas & Allocation</h1>
        </div>
        <p className="text-muted text-xs mt-1">
          Static hardware capacity provisioned across all instances in this project workspace.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Bar label="Database Instances" used={allocated.databases} limit={limits.databases} icon={Database} unit="clusters" />
        <Bar label="Dedicated vCPU Cores" used={allocated.cpu} limit={limits.cpu} icon={Cpu} unit="Cores" />
        <Bar label="Memory Buffer" used={allocated.memoryMb} limit={limits.memoryMb} icon={Layers} unit="MB" />
        <Bar label="Persistent NVMe Storage" used={allocated.storageGb} limit={limits.storageGb} icon={HardDrive} unit="GB" />
      </div>

      <div className="p-5 bg-surface/50 border border-border/60 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-sm text-text">Need higher database quotas?</h3>
          <p className="text-xs text-muted mt-0.5">Scale hardware capacity, memory pools, and maximum instance counts.</p>
        </div>
        <Link 
          href="/dashboard/subscription"
          className="px-4 py-2 bg-accent text-bg font-semibold text-xs rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 shrink-0"
        >
          <span>Upgrade Tier</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
