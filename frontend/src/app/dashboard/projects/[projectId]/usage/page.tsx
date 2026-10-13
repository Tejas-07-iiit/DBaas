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
import { Activity } from "lucide-react";

export default function UsagePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  
  const dbQuery = useQuery({ queryKey: ["databases", projectId], queryFn: async () => { const r: any = await listDatabases(projectId); return (r.data || r).map(mapDatabase); } });
  const subQuery = useQuery({ queryKey: ["subscription"], queryFn: async () => { const r: any = await getSubscription(); return mapSubscription(r.data || r); } });

  if (dbQuery.isLoading || subQuery.isLoading) return <div className="p-8">Loading usage data...</div>;
  if (dbQuery.error || subQuery.error) return <ErrorState error={dbQuery.error || subQuery.error} />;

  const databases = dbQuery.data || [];
  const limits = subQuery.data?.limits || {};

  const allocated = {
    databases: databases.length,
    cpu: databases.reduce((acc: number, db: any) => acc + db.cpu, 0),
    memoryMb: databases.reduce((acc: number, db: any) => acc + db.memoryMb, 0),
    storageGb: databases.reduce((acc: number, db: any) => acc + db.storageGb, 0)
  };

  const Bar = ({ label, used, limit }: { label: string, used: number, limit: number | undefined }) => {
    if (!limit) return <div className="bg-surface/30 p-4 border border-border/50 rounded-xl"><div className="text-sm text-muted mb-1">{label}</div><div className="font-bold text-xl">{used} <span className="text-sm font-normal text-muted">allocated (No limit)</span></div></div>;
    
    const pct = Math.min(100, Math.round((used / limit) * 100));
    let color = 'bg-accent';
    if (pct >= 100) color = 'bg-red-500';
    else if (pct >= 80) color = 'bg-amber-500';

    return (
      <div className="bg-surface/30 p-4 border border-border/50 rounded-xl">
         <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold">{label}</span>
            <span className="text-sm font-mono">{used} / {limit} ({pct}%)</span>
         </div>
         <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden">
            <div className={`h-full ${color}`} style={{ width: `${pct}%` }}></div>
         </div>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl">
       <h1 className="text-2xl font-bold flex items-center gap-2 mb-2"><Activity size={24}/> Usage</h1>
       <p className="text-muted text-sm mb-8">Allocation, not live consumption. See Metrics on each database for live values.</p>

       <div className="grid sm:grid-cols-2 gap-6 mb-12">
          <Bar label="Databases" used={allocated.databases} limit={limits.databases} />
          <Bar label="CPU (Cores)" used={allocated.cpu} limit={limits.cpu} />
          <Bar label="Memory (MB)" used={allocated.memoryMb} limit={limits.memoryMb} />
          <Bar label="Storage (GB)" used={allocated.storageGb} limit={limits.storageGb} />
       </div>
    </div>
  );
}