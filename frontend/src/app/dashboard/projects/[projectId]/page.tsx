/**
 * @file src/app/dashboard/projects/[projectId]/page.tsx
 * @description Project workspace overview dashboard.
 * Summarizes databases, active team members, and direct quick-navigation cards.
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProject, startProjectVm, stopProjectVm, restartProjectVm } from "@/lib/api/projects";
import { mapProject } from "@/lib/api/mappers";
import { listDatabases } from "@/lib/api/databases";
import { listMembers } from "@/lib/api/members";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { RoleBadge } from "@/components/dashboard/RoleBadge";
import Link from "next/link";
import { use, useState } from "react";
import { 
  Database, Users, Settings, Activity, ArrowRight, Plus, 
  Copy, Check, ShieldCheck, Calendar, Layers,
  Server, Cpu, HardDrive, Play, Square, RotateCw, Network, Zap, Loader2
} from "lucide-react";
import { toast } from "@/components/providers/ToastProvider";
import { CreateDatabaseModal } from "@/components/dashboard/CreateDatabaseModal";

export default function ProjectOverview({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();
  
  const dbQuery = useQuery({ queryKey: ["databases", projectId], queryFn: () => listDatabases(projectId) });
  const memQuery = useQuery({ queryKey: ["members", projectId], queryFn: () => listMembers(projectId) });
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res: any = await getProject(projectId);
      return mapProject(res.data || res);
    },
    retry: false,
    refetchInterval: (query) => {
      const proj = query.state.data;
      return proj?.status === "PROVISIONING" || proj?.status === "RESTARTING" ? 3000 : false;
    },
  });

  const startVmMut = useMutation({
    mutationFn: () => startProjectVm(projectId),
    onSuccess: () => {
      toast.success("Project VM started successfully");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to start Project VM");
    },
  });

  const stopVmMut = useMutation({
    mutationFn: () => stopProjectVm(projectId),
    onSuccess: () => {
      toast.success("Project VM powered down");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to stop Project VM");
    },
  });

  const restartVmMut = useMutation({
    mutationFn: () => restartProjectVm(projectId),
    onSuccess: () => {
      toast.success("Project VM restart initiated");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to restart Project VM");
    },
  });

  const handleCopyId = () => {
    navigator.clipboard.writeText(projectId);
    setCopied(true);
    toast.success("Project ID copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) return <div className="p-8 text-center text-muted text-xs">Loading project details...</div>;
  if (error) {
    if ((error as any).status === 404) return <ErrorState message="Project workspace not found" />;
    if ((error as any).status === 403) return <ErrorState message="You do not have permission to view this project." />;
    return <ErrorState message="Could not load project workspace" onRetry={refetch} />;
  }
  
  if (!data) return <ErrorState message="Could not load project" onRetry={refetch} />;

  const dbList = Array.isArray(dbQuery.data)
    ? dbQuery.data
    : Array.isArray((dbQuery.data as any)?.data)
    ? (dbQuery.data as any).data
    : [];

  const memList = Array.isArray(memQuery.data)
    ? memQuery.data
    : Array.isArray((memQuery.data as any)?.data)
    ? (memQuery.data as any).data
    : [];

  const isOwnerAdmin =
    (data?.role || "").toUpperCase() === "OWNER" ||
    (data?.role || "").toUpperCase() === "ADMIN";

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/30">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-text">{data.name}</h1>
            <RoleBadge role={data.role} />
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted">
            <span>ID: {projectId}</span>
            <button onClick={handleCopyId} className="text-muted hover:text-text p-1 transition-colors" title="Copy project ID">
              {copied ? <Check size={12} className="text-accent" /> : <Copy size={12} />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {isOwnerAdmin ? (
            <>
              <button 
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium text-xs rounded-xl transition-colors shadow-sm"
              >
                <Plus size={15} />
                <span>Launch Database</span>
              </button>
              <Link 
                href={`/dashboard/projects/${projectId}/settings`}
                className="p-2 bg-surface-2/60 hover:bg-surface-2 border border-border/60 rounded-lg text-muted hover:text-text transition-colors"
                title="Project settings"
              >
                <Settings size={16} />
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-2/70 border border-border/60 text-muted text-xs font-medium">
              <ShieldCheck size={14} className="text-primary-light" />
              <span>Read-Only (Member)</span>
            </div>
          )}
        </div>
      </div>

      {data.description && (
        <p className="text-muted text-xs leading-relaxed max-w-3xl">{data.description}</p>
      )}

      {/* DEDICATED PROJECT HOST VM CARD */}
      <div className="relative p-6 bg-gradient-to-b from-surface/90 via-surface/80 to-surface-2/60 border border-border/80 rounded-2xl space-y-5 shadow-xl overflow-hidden">
        {/* Subtle Accent Glow Top Highlight */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent opacity-70" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent shadow-[0_0_15px_rgba(16,185,129,0.25)]">
              <Server size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-text">Dedicated Host VM</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase inline-flex items-center gap-1.5 ${
                  data.status === 'RUNNING' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.3)]' 
                    : data.status === 'PROVISIONING'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse'
                    : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/30'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    data.status === 'RUNNING' 
                      ? 'bg-emerald-400 animate-pulse' 
                      : data.status === 'PROVISIONING' 
                      ? 'bg-amber-400 animate-ping' 
                      : 'bg-zinc-400'
                  }`} />
                  <span>{data.status}</span>
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                KVM virtualization host powering all databases in this project
              </p>
            </div>
          </div>

          {/* VM Control Actions */}
          <div className="flex items-center gap-2">
            {!isOwnerAdmin ? (
              <span className="text-[11px] font-mono text-muted px-2.5 py-1 bg-surface-2/80 rounded-lg border border-border/50">
                Managed by Project Admin
              </span>
            ) : data.status === 'STOPPED' ? (
              <button
                onClick={() => startVmMut.mutate()}
                disabled={startVmMut.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 shadow-sm"
              >
                {startVmMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                <span>Start Host VM</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => restartVmMut.mutate()}
                  disabled={restartVmMut.isPending || data.status !== 'RUNNING'}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-surface-2 hover:bg-surface-2/80 text-muted hover:text-text border border-border/70 rounded-xl text-xs font-medium transition-colors disabled:opacity-40"
                  title="Reboot virtual machine"
                >
                  {restartVmMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <RotateCw size={14} />}
                  <span>Restart</span>
                </button>
                <button
                  onClick={() => stopVmMut.mutate()}
                  disabled={stopVmMut.isPending || data.status !== 'RUNNING'}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40"
                  title="Power off host VM to save resources"
                >
                  {stopVmMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Square size={14} />}
                  <span>Stop VM</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Specs Grid with Visual Resource Bars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
          <div className="p-3.5 bg-surface-2/60 rounded-xl border border-border/60">
            <div className="flex items-center justify-between text-muted text-[11px] mb-1">
              <span>Compute</span>
              <Cpu size={14} className="text-accent" />
            </div>
            <div className="font-bold text-sm text-text font-mono">
              {data.cpuCores} vCPU Cores
            </div>
            <div className="w-full bg-surface-3 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div className="bg-accent h-1.5 rounded-full" style={{ width: `${Math.min(100, (data.cpuCores / 8) * 100)}%` }} />
            </div>
          </div>

          <div className="p-3.5 bg-surface-2/60 rounded-xl border border-border/60">
            <div className="flex items-center justify-between text-muted text-[11px] mb-1">
              <span>Memory</span>
              <Layers size={14} className="text-accent" />
            </div>
            <div className="font-bold text-sm text-text font-mono">
              {Math.round(data.ramMb / 1024)} GB RAM
            </div>
            <div className="w-full bg-surface-3 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div className="bg-accent h-1.5 rounded-full" style={{ width: `${Math.min(100, (data.ramMb / 16384) * 100)}%` }} />
            </div>
          </div>

          <div className="p-3.5 bg-surface-2/60 rounded-xl border border-border/60">
            <div className="flex items-center justify-between text-muted text-[11px] mb-1">
              <span>NVMe Storage</span>
              <HardDrive size={14} className="text-accent" />
            </div>
            <div className="font-bold text-sm text-text font-mono">
              {Math.round(data.storageMb / 1024)} GB Disk
            </div>
            <div className="w-full bg-surface-3 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div className="bg-accent h-1.5 rounded-full" style={{ width: `${Math.min(100, (data.storageMb / 102400) * 100)}%` }} />
            </div>
          </div>

          <div className="p-3.5 bg-surface-2/60 rounded-xl border border-border/60">
            <div className="flex items-center justify-between text-muted text-[11px] mb-1">
              <span>Internal IP</span>
              <Network size={14} className="text-accent" />
            </div>
            <div className="font-bold text-sm text-text font-mono">
              {data.internalIp || '192.168.122.x'}
            </div>
            <div className="text-[10px] text-muted font-mono mt-2 truncate">
              virbr0 virtual bridge
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted pt-1">
          <div className="flex items-center gap-1.5">
            <Zap size={14} className="text-amber-400 shrink-0" />
            <span>Multi-database host: create unlimited PostgreSQL and MongoDB instances instantly on this VM.</span>
          </div>
          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface-2 border border-border/60 self-start sm:self-auto">
            Domain: {data.vmId || 'db-' + projectId.slice(0, 10)}
          </span>
        </div>
      </div>
      
      {/* METRICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-surface/50 border border-border/50 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Your Role</span>
            <ShieldCheck size={16} />
          </div>
          <div className="text-xl font-bold text-text">{data.role}</div>
          <div className="text-[11px] text-muted">Workspace member access</div>
        </div>

        <div className="p-4 bg-surface/50 border border-border/50 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Created</span>
            <Calendar size={16} />
          </div>
          <div className="text-xl font-bold text-text">{new Date(data.createdAt).toLocaleDateString()}</div>
          <div className="text-[11px] text-muted">Project launch timestamp</div>
        </div>

        <div className="p-4 bg-surface/50 border border-border/50 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Databases</span>
            <Database size={16} />
          </div>
          <div className="text-xl font-bold text-text">
            {dbQuery.isLoading ? "..." : dbList.length}
          </div>
          <Link href={`/dashboard/projects/${projectId}/databases`} className="text-[11px] text-accent hover:underline flex items-center gap-1">
            <span>Manage instances</span>
            <ArrowRight size={10} />
          </Link>
        </div>
      
        <div className="p-4 bg-surface/50 border border-border/50 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Team Members</span>
            <Users size={16} />
          </div>
          <div className="text-xl font-bold text-text">
            {memQuery.isLoading ? "..." : memList.length}
          </div>
          <Link href={`/dashboard/projects/${projectId}/team`} className="text-[11px] text-accent hover:underline flex items-center gap-1">
            <span>Manage collaborators</span>
            <ArrowRight size={10} />
          </Link>
        </div>
      </div>

      {/* DATABASE INSTANCES SECTION (Selected directly from Project Section) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-accent" />
            <h2 className="text-xs font-semibold text-text uppercase tracking-wider">
              Database Clusters ({dbList.length})
            </h2>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white font-medium text-xs rounded-xl transition-colors shadow-xs"
          >
            <Plus size={14} />
            <span>Launch Database</span>
          </button>
        </div>

        <div className="bg-surface/70 border border-border/70 rounded-2xl overflow-hidden shadow-sm">
          {dbQuery.isLoading ? (
            <div className="p-8 text-center text-muted text-xs">Loading database clusters...</div>
          ) : dbList.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/30 text-accent flex items-center justify-center mx-auto">
                <Database size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-text">No databases launched yet</h3>
                <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                  Launch your first PostgreSQL, MongoDB, or Qdrant cluster on this dedicated VM.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-medium rounded-xl transition-colors shadow-xs"
              >
                Launch First Database
              </button>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {dbList.map((dbItem: any) => {
                const engine = (dbItem.engine || "").toLowerCase();
                const engineBadgeColor =
                  engine === "mongodb"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : engine === "postgresql"
                    ? "bg-violet-500/10 text-violet-400 border-violet-500/30"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/30";
                return (
                  <div
                    key={dbItem.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-2/60 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <Link
                          href={`/dashboard/projects/${projectId}/databases/${dbItem.id}`}
                          className="font-bold text-sm text-text hover:text-accent transition-colors flex items-center gap-2"
                        >
                          <Database size={15} className="text-accent shrink-0" />
                          <span>{dbItem.name}</span>
                        </Link>
                        <span
                          className={`text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-full border ${engineBadgeColor}`}
                        >
                          {dbItem.engine || "Cluster"}
                        </span>
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            dbItem.status === "running"
                              ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]"
                              : dbItem.status === "provisioning"
                              ? "bg-amber-400 animate-pulse"
                              : "bg-zinc-500"
                          }`}
                        />
                      </div>
                      <div className="text-[11px] font-mono text-muted flex items-center gap-2">
                        <span>Status: <strong className="text-text capitalize">{dbItem.status || "Ready"}</strong></span>
                        <span>·</span>
                        <span>Port: {dbItem.port || 5432}</span>
                        {dbItem.cpu && <span>· {dbItem.cpu} vCPU</span>}
                        {dbItem.memoryMb && <span>· {Math.round(dbItem.memoryMb / 1024)}GB RAM</span>}
                      </div>
                    </div>

                    <Link
                      href={`/dashboard/projects/${projectId}/databases/${dbItem.id}`}
                      className="px-3.5 py-1.5 bg-surface-2 hover:bg-surface-2/80 border border-border/70 rounded-xl text-xs font-semibold text-accent flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-xs"
                    >
                      <span>Open Console</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* QUICK WORKSPACE NAVIGATION CARDS */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">Project Services</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link 
            href={`/dashboard/projects/${projectId}/team`}
            className="p-5 bg-surface/50 hover:bg-surface-2/40 border border-border/50 hover:border-accent/40 rounded-xl transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border/60 flex items-center justify-center text-accent mb-4 group-hover:border-accent transition-colors">
              <Users size={20} />
            </div>
            <h3 className="font-semibold text-sm text-text group-hover:text-accent transition-colors mb-1">
              Team & Permissions
            </h3>
            <p className="text-xs text-muted leading-relaxed mb-4">
              Invite collaborators, manage RBAC privileges, and assign workspace administrative roles.
            </p>
            <span className="text-xs font-semibold text-accent flex items-center gap-1">
              <span>View Team ({memList.length})</span>
              <ArrowRight size={13} />
            </span>
          </Link>

          <Link 
            href={`/dashboard/projects/${projectId}/settings`}
            className="p-5 bg-surface/50 hover:bg-surface-2/40 border border-border/50 hover:border-accent/40 rounded-xl transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border/60 flex items-center justify-center text-accent mb-4 group-hover:border-accent transition-colors">
              <Settings size={20} />
            </div>
            <h3 className="font-semibold text-sm text-text group-hover:text-accent transition-colors mb-1">
              Project Settings
            </h3>
            <p className="text-xs text-muted leading-relaxed mb-4">
              Update project name, description metadata, and manage danger-zone deletion operations.
            </p>
            <span className="text-xs font-semibold text-accent flex items-center gap-1">
              <span>Configure Settings</span>
              <ArrowRight size={13} />
            </span>
          </Link>
        </div>
      </div>

      <CreateDatabaseModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        projectId={projectId} 
      />
    </div>
  );
}
