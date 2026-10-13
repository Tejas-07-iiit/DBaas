/**
 * @file src/app/dashboard/projects/[projectId]/databases/page.tsx
 * @description Database instances listing for a specific project.
 * Features search filtering, engine categorization, auto-polling on transitional states,
 * and database creation wizard trigger.
 */

"use client";

import { use, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { listDatabases } from "@/lib/api/databases";
import { getProject } from "@/lib/api/projects";
import { mapDatabase, mapProject } from "@/lib/api/mappers";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { CreateDatabaseModal } from "@/components/dashboard/CreateDatabaseModal";
import Link from "next/link";
import { Database, Plus, Search } from "lucide-react";

export default function DatabasesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [engineFilter, setEngineFilter] = useState("All");

  const projQuery = useQuery({ queryKey: ["project", projectId], queryFn: async () => { const r: any = await getProject(projectId); return mapProject(r.data || r); }, retry: false });
  const dbQuery = useQuery({ queryKey: ["databases", projectId], queryFn: async () => { const r: any = await listDatabases(projectId); return (r.data || r).map(mapDatabase); } });

  const hasTransitional = dbQuery.data?.some((d: any) => ['provisioning', 'starting', 'stopping', 'restarting', 'deleting'].includes(d.status));
  
  useEffect(() => {
    let int: any;
    if (hasTransitional) int = setInterval(() => dbQuery.refetch(), 3000);
    return () => clearInterval(int);
  }, [hasTransitional, dbQuery]);

  const isMember = projQuery.data?.role === "Member";

  if (projQuery.isLoading) return <div>Loading...</div>;
  if (projQuery.error) return <ErrorState error={projQuery.error} />;

  const filtered = dbQuery.data?.filter((d: any) => d.name.includes(search) && (engineFilter === "All" || d.engine.toLowerCase() === engineFilter.toLowerCase())) || [];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Database size={24} /> Databases</h1>
        <div className="group relative">
          <button 
            disabled={isMember} 
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-text text-bg rounded font-bold text-sm disabled:opacity-50"
          >
            <Plus size={16} /> New database
          </button>
          {isMember && <div className="absolute top-full mt-2 w-max right-0 bg-surface border border-border p-2 rounded text-xs text-muted opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">Members cannot create databases</div>}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-2.5 text-muted" />
          <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-surface-2 border border-border/50 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-accent" />
        </div>
        <div className="flex gap-2">
          {['All', 'MongoDB', 'PostgreSQL', 'Qdrant'].map(e => (
            <button key={e} onClick={() => setEngineFilter(e)} className={`px-3 py-1.5 rounded-lg text-sm border font-bold ${engineFilter === e ? 'bg-accent/10 border-accent/50 text-accent' : 'bg-surface-2 border-border/50 text-muted hover:border-text/30'}`}>{e}</button>
          ))}
        </div>
        {hasTransitional && <div className="flex items-center gap-2 text-xs text-accent font-mono animate-pulse"><span className="w-2 h-2 rounded-full bg-accent"></span> Updating...</div>}
      </div>

      {dbQuery.isLoading && <div className="animate-pulse bg-surface-2 h-64 rounded-xl"></div>}
      {dbQuery.error && <ErrorState error={dbQuery.error} onRetry={dbQuery.refetch} />}
      {!dbQuery.isLoading && !dbQuery.error && filtered.length === 0 && (
        <EmptyState title="No databases found" action={<button disabled={isMember} onClick={() => setModalOpen(true)} className="px-4 py-2 bg-text text-bg rounded mt-4">Create one</button>} />
      )}
      {!dbQuery.isLoading && !dbQuery.error && filtered.length > 0 && (
        <div className="bg-surface/30 border border-border/50 rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-2 text-muted uppercase text-[10px] font-bold tracking-widest">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Engine</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Resources</th>
                <th className="px-6 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map((db: any) => (
                <tr key={db.id} className="hover:bg-surface-2/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-accent">
                    <Link href={`/dashboard/projects/${projectId}/databases/${db.id}`} className="hover:underline flex items-center gap-2">
                       <span className={`w-2 h-2 rounded-full ${db.engine.toLowerCase() === 'mongodb' ? 'bg-[#47A248]' : db.engine.toLowerCase() === 'postgresql' ? 'bg-[#336791]' : 'bg-accent'}`}></span>
                       {db.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 capitalize">{db.engine}</td>
                  <td className="px-6 py-4"><StatusBadge status={db.status} /></td>
                  <td className="px-6 py-4 text-muted font-mono text-xs">{db.cpu} CPU / {db.memoryMb} MB / {db.storageGb} GB</td>
                  <td className="px-6 py-4 text-muted text-xs">{new Date(db.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateDatabaseModal isOpen={modalOpen} onClose={() => setModalOpen(false)} projectId={projectId} />
    </div>
  );
}