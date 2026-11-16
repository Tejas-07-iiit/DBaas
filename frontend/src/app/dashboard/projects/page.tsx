/**
 * @file src/app/dashboard/projects/page.tsx
 * @description All Projects workspace index.
 * Lists projects owned by or shared with the user with creation modal and direct workspace links.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { listProjects } from "@/lib/api/projects";
import { mapProject } from "@/lib/api/mappers";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { RoleBadge } from "@/components/dashboard/RoleBadge";
import Link from "next/link";
import { CreateProjectModal } from "@/components/dashboard/CreateProjectModal";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FolderKanban, Plus, Search, ArrowRight, LayoutGrid, List, Mail } from "lucide-react";
import { getMyPendingInvitations } from "@/lib/api/invitations";

function PendingInvitationsBanner({ invitations }: { invitations: any[] }) {
  if (!invitations || invitations.length === 0) return null;
  const count = invitations.length;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-surface-elevated border border-emerald-500/30 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
      <div className="flex items-start sm:items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
          <Mail size={18} />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-bold text-foreground">
              Workspace Invitation{count > 1 ? "s" : ""}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
              {count} Pending
            </span>
          </div>
          <p className="text-xs text-foreground-muted leading-relaxed">
            {count === 1 ? (
              <>
                You have been invited to join <strong className="text-foreground">{invitations[0].projectName || "a workspace"}</strong> as <span className="font-mono text-primary-light uppercase text-[10px] font-semibold">{invitations[0].role}</span>.
              </>
            ) : (
              <>You have {count} pending workspace invitations waiting for your acceptance.</>
            )}
          </p>
        </div>
      </div>
      <Link
        href="/dashboard/invitations"
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-all shrink-0 shadow-sm self-stretch sm:self-auto justify-center"
      >
        <span>Review & Accept</span>
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}

function ProjectsContent() {
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const engineParam = searchParams.get("engine");
  const initialName = engineParam ? `My ${engineParam} Project` : "";
  const initialDesc = engineParam ? `Project initialized for ${engineParam} workloads.` : "";

  useEffect(() => {
    if (searchParams.get("create") === "true" || searchParams.get("new") === "true") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const { data: pendingInvitations = [] } = useQuery({
    queryKey: ["my-pending-invitations"],
    queryFn: getMyPendingInvitations,
    refetchInterval: 10000,
  });

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res: any = await listProjects();
      return (res.data || res || []).map(mapProject);
    }
  });

  if (isLoading) return <div className="p-8 text-center text-muted text-xs">Loading projects...</div>;
  if (error) return <ErrorState error={error} message="Could not load projects" onRetry={refetch} />;
  
  if (!data || data.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-border/30">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text">Projects</h1>
            <p className="text-muted text-xs mt-1">Manage all projects in your organization.</p>
          </div>
        </div>

        {/* PENDING INVITATIONS BANNER */}
        <PendingInvitationsBanner invitations={pendingInvitations} />

        <EmptyState 
          title="Create your first project" 
          description="Projects group your database clusters, team roles, and connection parameters."
          action={
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-medium"
            >
              New Project
            </button>
          } 
        />
        <CreateProjectModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          initialName={initialName}
          initialDescription={initialDesc}
        />
      </div>
    );
  }

  const filtered = data.filter((p: any) => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/30">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Projects</h1>
          <p className="text-muted text-xs mt-1">
            {data.length} {data.length === 1 ? "project" : "projects"} in your workspace
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium text-xs rounded-xl transition-colors self-start sm:self-auto shadow-sm"
        >
          <Plus size={15} />
          <span>New Project</span>
        </button>
      </div>

      {/* PENDING INVITATIONS BANNER */}
      <PendingInvitationsBanner invitations={pendingInvitations} />

      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input 
            type="text" 
            placeholder="Search projects..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-2/60 border border-border/60 rounded-lg pl-9 pr-4 py-2 text-xs text-text placeholder:text-muted outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 bg-surface-2/60 border border-border/60 rounded-lg p-1 self-end sm:self-auto">
          <button 
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded text-xs transition-colors ${
              viewMode === "grid" ? "bg-surface text-accent font-semibold shadow-sm" : "text-muted hover:text-text"
            }`}
            title="Grid view"
          >
            <LayoutGrid size={14} />
          </button>
          <button 
            onClick={() => setViewMode("table")}
            className={`p-1.5 rounded text-xs transition-colors ${
              viewMode === "table" ? "bg-surface text-accent font-semibold shadow-sm" : "text-muted hover:text-text"
            }`}
            title="Table view"
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* VIEW: GRID */}
      {viewMode === "grid" ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p: any) => (
            <div 
              key={p.id} 
              className="p-5 bg-surface/70 border border-border/70 rounded-2xl hover:border-accent/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.08)] transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-3 gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent shrink-0 group-hover:border-accent group-hover:shadow-[0_0_12px_rgba(16,185,129,0.2)] transition-all">
                      <FolderKanban size={17} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-base text-text truncate group-hover:text-accent transition-colors">
                        {p.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          p.status === 'RUNNING' 
                            ? 'bg-emerald-400' 
                            : p.status === 'PROVISIONING' 
                            ? 'bg-amber-400 animate-pulse' 
                            : 'bg-zinc-500'
                        }`} />
                        <span className="text-[10px] font-mono uppercase text-muted font-semibold tracking-wider">
                          {p.status || 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <RoleBadge role={p.role} />
                </div>
                
                <p className="text-muted text-xs line-clamp-2 mb-4 h-8 leading-relaxed">
                  {p.description || "Dedicated KVM virtualization workspace."}
                </p>

                {/* Hardware Spec Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-surface-2/80 border border-border/60 text-text font-medium">
                    {p.cpuCores || 4} vCPU
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-surface-2/80 border border-border/60 text-text font-medium">
                    {p.ramMb ? Math.round(p.ramMb / 1024) : 8} GB RAM
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-surface-2/80 border border-border/60 text-text font-medium">
                    {p.storageMb ? Math.round(p.storageMb / 1024) : 50} GB NVMe
                  </span>
                  {p.internalIp && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20 text-accent font-semibold">
                      {p.internalIp}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3.5 border-t border-border/30 text-xs">
                <span className="text-muted font-mono text-[11px]">
                  Created {new Date(p.createdAt).toLocaleDateString()}
                </span>
                <Link 
                  href={`/dashboard/projects/${p.id}`} 
                  className="px-3 py-1.5 bg-surface-2 hover:bg-surface-2/80 border border-border/70 rounded-xl text-xs text-accent font-semibold flex items-center gap-1.5 transition-colors group-hover:border-accent/40"
                >
                  <span>Open Console</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* VIEW: TABLE */
        <div className="bg-surface/60 border border-border/70 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-2 text-muted uppercase text-[10px] font-semibold tracking-wider border-b border-border/40">
              <tr>
                <th className="px-6 py-3.5">Workspace</th>
                <th className="px-6 py-3.5">Host VM Status</th>
                <th className="px-6 py-3.5">Hardware Allocation</th>
                <th className="px-6 py-3.5">Your Role</th>
                <th className="px-6 py-3.5">Created</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.map((p: any) => (
                <tr key={p.id} className="hover:bg-surface-2/60 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/projects/${p.id}`} className="font-semibold text-sm text-text hover:text-accent transition-colors flex items-center gap-2.5">
                      <FolderKanban size={16} className="text-accent shrink-0" />
                      <span>{p.name}</span>
                    </Link>
                    {p.description && (
                      <div className="text-muted text-[11px] truncate max-w-md mt-0.5">{p.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-surface-2 border border-border/60">
                      <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'RUNNING' ? 'bg-emerald-400' : p.status === 'PROVISIONING' ? 'bg-amber-400 animate-pulse' : 'bg-zinc-500'}`} />
                      <span>{p.status || 'Active'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-[11px] text-muted">
                    {p.cpuCores || 4} vCPU · {p.ramMb ? Math.round(p.ramMb / 1024) : 8} GB · {p.storageMb ? Math.round(p.storageMb / 1024) : 50} GB
                  </td>
                  <td className="px-6 py-4">
                    <RoleBadge role={p.role} />
                  </td>
                  <td className="px-6 py-4 text-muted font-mono text-[11px]">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/dashboard/projects/${p.id}`} 
                      className="px-3 py-1.5 bg-surface-2 hover:bg-surface-2/80 border border-border/70 rounded-xl font-semibold text-xs text-text hover:text-accent transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>Console</span>
                      <ArrowRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted text-xs">
          No projects matched &ldquo;{search}&rdquo;
        </div>
      )}

      <CreateProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialName={initialName}
        initialDescription={initialDesc}
      />
    </div>
  );
}

export default function ProjectsList() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted text-xs">Loading projects...</div>}>
      <ProjectsContent />
    </Suspense>
  );
}
