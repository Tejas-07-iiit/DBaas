/**
 * @file src/app/dashboard/projects/[projectId]/databases/page.tsx
 * @description Database instances listing for a specific project.
 * Features search filtering, engine categorization, auto-polling on transitional states,
 * quick actions (delete instance), and database creation wizard trigger.
 */

"use client";

import { use, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listDatabases, deleteDatabase } from "@/lib/api/databases";
import { getProject } from "@/lib/api/projects";
import { mapDatabase, mapProject } from "@/lib/api/mappers";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { CreateDatabaseModal } from "@/components/dashboard/CreateDatabaseModal";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { toast } from "@/components/providers/ToastProvider";
import Link from "next/link";
import { Database, Plus, Search, Trash2, ArrowRight, RefreshCw, Cpu, HardDrive } from "lucide-react";

export default function DatabasesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [engineFilter, setEngineFilter] = useState("All");
  const [dbToDelete, setDbToDelete] = useState<{ id: string; name: string } | null>(null);

  const projQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const r: any = await getProject(projectId);
      return mapProject(r.data || r);
    },
    retry: false,
  });

  const dbQuery = useQuery({
    queryKey: ["databases", projectId],
    queryFn: async () => {
      const r: any = await listDatabases(projectId);
      const list = Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : [];
      return list.map(mapDatabase);
    },
  });

  const dbList = Array.isArray(dbQuery.data)
    ? dbQuery.data
    : Array.isArray((dbQuery.data as any)?.data)
    ? (dbQuery.data as any).data
    : [];

  const hasTransitional = dbList.some((d: any) =>
    ["provisioning", "starting", "stopping", "restarting", "deleting"].includes(d?.status)
  );

  useEffect(() => {
    let int: any;
    if (hasTransitional) int = setInterval(() => dbQuery.refetch(), 3000);
    return () => clearInterval(int);
  }, [hasTransitional, dbQuery]);

  const isMember = projQuery.data?.role === "Member";

  const deleteMut = useMutation({
    mutationFn: (databaseId: string) => deleteDatabase(projectId, databaseId),
    onSuccess: () => {
      toast.success("Database deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["databases", projectId] });
      setDbToDelete(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete database");
    },
  });

  if (projQuery.isLoading) return <div className="p-8 text-center text-muted text-xs">Loading project scope...</div>;
  if (projQuery.error) return <ErrorState error={projQuery.error} />;

  const filtered = dbList.filter(
    (d: any) =>
      (d.name || "").toLowerCase().includes(search.toLowerCase()) &&
      (engineFilter === "All" || (d.engine || "").toLowerCase() === engineFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/30">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-text">Databases</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-surface-2 border border-border/60 text-muted">
              {dbList.length}
            </span>
          </div>
          <p className="text-muted text-xs mt-1">
            Provisioned database instances inside {projQuery.data?.name || "this project"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasTransitional && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/30 text-accent text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
              <span>Syncing State</span>
            </div>
          )}

          <div className="group relative">
            <button
              disabled={isMember}
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-bg rounded-lg font-semibold text-xs disabled:opacity-40 hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus size={15} />
              <span>New Database</span>
            </button>
            {isMember && (
              <div className="absolute top-full mt-2 w-max right-0 bg-surface border border-border/80 px-2.5 py-1.5 rounded-md text-[11px] text-muted opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none shadow-lg">
                Member role has read-only permissions
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Filter by database name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-2/60 border border-border/60 rounded-lg pl-9 pr-4 py-2 text-xs text-text placeholder:text-muted outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          {["All", "PostgreSQL", "MongoDB", "Qdrant"].map((e) => {
            const isSelected = engineFilter.toLowerCase() === e.toLowerCase();
            return (
              <button
                key={e}
                onClick={() => setEngineFilter(e)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                  isSelected
                    ? "bg-accent/10 border-accent/50 text-accent font-semibold"
                    : "bg-surface-2/60 border-border/60 text-muted hover:text-text hover:bg-surface-2"
                }`}
              >
                {e}
              </button>
            );
          })}
        </div>
      </div>

      {/* DATA VIEW */}
      {dbQuery.isLoading && <div className="h-64 bg-surface-2/40 border border-border/40 rounded-xl animate-pulse"></div>}
      {dbQuery.error && <ErrorState error={dbQuery.error} onRetry={dbQuery.refetch} />}
      
      {!dbQuery.isLoading && !dbQuery.error && filtered.length === 0 && (
        <EmptyState
          title={search || engineFilter !== "All" ? "No matching databases" : "No databases provisioned"}
          description={
            search || engineFilter !== "All" 
              ? "Try adjusting your search filter."
              : "Launch your first managed PostgreSQL, MongoDB, or Qdrant cluster in this project."
          }
          action={
            <button
              disabled={isMember}
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 bg-accent text-bg rounded-lg font-semibold text-xs hover:opacity-90 disabled:opacity-40"
            >
              Launch Database
            </button>
          }
        />
      )}

      {!dbQuery.isLoading && !dbQuery.error && filtered.length > 0 && (
        <div className="bg-surface/40 border border-border/50 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-2 text-muted uppercase text-[10px] font-semibold tracking-wider border-b border-border/40">
              <tr>
                <th className="px-6 py-3.5">Instance</th>
                <th className="px-6 py-3.5">Engine</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Resources</th>
                <th className="px-6 py-3.5">Created</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.map((db: any) => {
                const isMongo = db.engine?.toLowerCase() === "mongodb";
                const isPg = db.engine?.toLowerCase() === "postgresql";
                const isQdrant = db.engine?.toLowerCase() === "qdrant";
                
                const dotColor = isMongo 
                  ? "bg-[#3FCF6D]" 
                  : isPg 
                  ? "bg-[#4C8DFF]" 
                  : "bg-[#FF4D8D]";

                return (
                  <tr key={db.id} className="hover:bg-surface-2/40 transition-colors">
                    <td className="px-6 py-4 font-semibold">
                      <Link
                        href={`/dashboard/projects/${projectId}/databases/${db.id}`}
                        className="hover:underline flex items-center gap-2.5 text-text hover:text-accent transition-colors"
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${dotColor} shrink-0`}></span>
                        <span className="text-sm">{db.name}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize font-medium text-text">{db.engine}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={db.status} />
                    </td>
                    <td className="px-6 py-4 text-muted font-mono text-[11px]">
                      {db.cpu} vCPU · {db.memoryMb} MB · {db.storageGb} GB
                    </td>
                    <td className="px-6 py-4 text-muted font-mono text-[11px]">
                      {new Date(db.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/projects/${projectId}/databases/${db.id}`}
                          className="px-2.5 py-1.5 rounded-md hover:bg-surface-2 text-accent font-semibold text-xs flex items-center gap-1 transition-colors"
                        >
                          <span>Console</span>
                          <ArrowRight size={12} />
                        </Link>
                        <button
                          title={isMember ? "Members cannot delete" : "Delete database instance"}
                          disabled={isMember || ["deleting", "provisioning"].includes(db.status) || deleteMut.isPending}
                          onClick={() => setDbToDelete({ id: db.id, name: db.name })}
                          className="p-1.5 text-muted hover:text-red-400 hover:bg-surface-2 rounded-md transition-colors disabled:opacity-20"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!dbToDelete}
        onClose={() => setDbToDelete(null)}
        title="Delete Database Instance"
        message={`Are you sure you want to permanently delete instance "${dbToDelete?.name}"? All database files, collections, and attached NVMe storage will be permanently wiped.`}
        confirmText="Delete Instance"
        danger
        isLoading={deleteMut.isPending}
        onConfirm={() => {
          if (dbToDelete) {
            deleteMut.mutate(dbToDelete.id);
          }
        }}
      />

      <CreateDatabaseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        projectId={projectId}
      />
    </div>
  );
}
