/**
 * @file src/app/dashboard/page.tsx
 * @description Main dashboard overview screen.
 * Displays high-level account telemetry: active projects, subscription plan limits,
 * interactive onboarding checklist, and recent projects table.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { listProjects } from "@/lib/api/projects";
import { getSubscription } from "@/lib/api/subscription";
import { mapProject, mapSubscription } from "@/lib/api/mappers";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { RoleBadge } from "@/components/dashboard/RoleBadge";
import { CreateProjectModal } from "@/components/dashboard/CreateProjectModal";
import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  Check, FolderKanban, Plus, FileText, Database, CreditCard, 
  ArrowRight, ShieldCheck, Sparkles, Activity, Server, Cpu, HardDrive
} from "lucide-react";

function StatCard({ title, value, subtitle, icon: Icon, isLoading, error, onRetry, linkHref, linkLabel }: any) {
  return (
    <div className="bg-surface/70 border border-border/70 rounded-2xl p-5 flex flex-col justify-between hover:border-accent/40 transition-all duration-200 shadow-sm group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:border-accent group-hover:shadow-[0_0_12px_rgba(16,185,129,0.25)] transition-all">
            <Icon size={16} />
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="h-8 bg-surface-2 rounded animate-pulse w-24 mb-1"></div>
      ) : error ? (
        <div className="text-xs text-red-400 py-1">
          Unavailable <button onClick={onRetry} className="underline ml-1 font-semibold">Retry</button>
        </div>
      ) : (
        <div className="text-2xl font-bold text-text tracking-tight mb-0.5">{value}</div>
      )}

      {subtitle && !isLoading && !error && (
        <div className="text-[11px] text-muted font-mono">{subtitle}</div>
      )}

      {linkHref && !isLoading && !error ? (
        <Link href={linkHref} className="text-xs text-accent hover:underline flex items-center gap-1 font-semibold mt-3 pt-2 border-t border-border/30">
          <span>{linkLabel}</span>
          <ArrowRight size={12} />
        </Link>
      ) : (
        <div className="h-1 mt-2"></div>
      )}
    </div>
  );
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastOpenedId, setLastOpenedId] = useState<string | null>(null);

  useEffect(() => {
    try { setLastOpenedId(localStorage.getItem('dbaas_last_project')); } catch {}
  }, []);

  const projQuery = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res: any = await listProjects();
      return (res.data || res || []).map(mapProject);
    }
  });

  const subQuery = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const res: any = await getSubscription();
      return mapSubscription(res.data || res);
    },
    retry: false
  });

  const projects = projQuery.data || [];
  const projectsYouOwn = projects.filter((p: any) => p.role === 'Owner');
  const runningVms = projects.filter((p: any) => p.status === 'RUNNING');
  const recentProjects = [...projects].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  
  const lastProjectExists = lastOpenedId && projects.find((p: any) => p.id === lastOpenedId);

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Overview</h1>
          <p className="text-muted text-xs mt-1">Manage all cloud database workspaces, instances, and billing.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium text-xs rounded-xl transition-colors self-start sm:self-auto shadow-sm"
        >
          <Plus size={15} />
          <span>New Project</span>
        </button>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Projects" 
          value={projects.length} 
          subtitle="Provisioned workspaces"
          icon={FolderKanban}
          isLoading={projQuery.isLoading} 
          error={projQuery.error} 
          onRetry={projQuery.refetch}
          linkHref="/dashboard/projects"
          linkLabel="View all projects"
        />
        <StatCard 
          title="Host VMs Running" 
          value={runningVms.length} 
          subtitle={`${projects.length - runningVms.length} stopped / suspended`}
          icon={Server}
          isLoading={projQuery.isLoading} 
          error={projQuery.error} 
          onRetry={projQuery.refetch}
        />
        <StatCard 
          title="Owned By You" 
          value={projectsYouOwn.length} 
          subtitle="Direct workspace ownership"
          icon={ShieldCheck}
          isLoading={projQuery.isLoading} 
          error={projQuery.error} 
          onRetry={projQuery.refetch}
        />
        <StatCard 
          title="Subscription Tier" 
          value={subQuery.data?.planName || 'Free Sandbox'} 
          subtitle="Platform billing status"
          icon={CreditCard}
          isLoading={subQuery.isLoading} 
          error={subQuery.error} 
          onRetry={subQuery.refetch}
          linkHref="/dashboard/subscription"
          linkLabel="Manage billing"
        />
      </div>

      {/* CONTINUE STRIP */}
      {lastProjectExists && (
        <div className="bg-gradient-to-r from-surface-2/90 via-surface/90 to-surface-2/90 border border-accent/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <FolderKanban size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-accent uppercase tracking-wider font-bold">
                  Quick Resume
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${lastProjectExists.status === 'RUNNING' ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
              </div>
              <div className="font-bold text-base text-text mt-0.5">{lastProjectExists.name}</div>
              <div className="text-[11px] text-muted font-mono mt-0.5">
                {lastProjectExists.cpuCores} vCPU · {Math.round(lastProjectExists.ramMb / 1024)} GB RAM · {Math.round(lastProjectExists.storageMb / 1024)} GB NVMe
              </div>
            </div>
          </div>
          <Link 
            href={`/dashboard/projects/${lastProjectExists.id}`} 
            className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white font-medium text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>Open Console</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* 2-COL LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* PROJECTS TABLE */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban size={16} className="text-accent" />
              <h2 className="text-xs font-semibold text-text uppercase tracking-wider">Recent Workspaces</h2>
            </div>
            <Link href="/dashboard/projects" className="text-xs text-accent hover:underline flex items-center gap-1 font-semibold">
              <span>View all ({projects.length})</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="bg-surface/60 border border-border/70 rounded-2xl overflow-hidden shadow-sm">
            {projQuery.isLoading ? (
              <div className="p-12 text-center text-muted text-xs">Loading projects...</div>
            ) : projQuery.error ? (
              <ErrorState error={projQuery.error} onRetry={projQuery.refetch} />
            ) : recentProjects.length === 0 ? (
              <EmptyState 
                title="No projects provisioned yet" 
                description="Create your first project workspace to begin deploying MongoDB, PostgreSQL, and Qdrant clusters."
                action={
                  <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-medium">
                    Create Project
                  </button>
                } 
              />
            ) : (
              <div className="divide-y divide-border/40">
                {recentProjects.map((p: any) => (
                  <div key={p.id} className="p-4 flex items-center justify-between hover:bg-surface-2/60 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <Link href={`/dashboard/projects/${p.id}`} className="font-semibold text-sm text-text hover:text-accent transition-colors">
                          {p.name}
                        </Link>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.status === 'RUNNING' ? 'bg-emerald-400' : p.status === 'PROVISIONING' ? 'bg-amber-400 animate-pulse' : 'bg-zinc-500'}`} />
                        <RoleBadge role={p.role} />
                      </div>
                      <div className="text-[11px] text-muted font-mono flex items-center gap-2">
                        <span>{p.cpuCores} vCPU · {Math.round(p.ramMb / 1024)} GB RAM</span>
                        <span>·</span>
                        <span>Created {new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Link 
                      href={`/dashboard/projects/${p.id}`} 
                      className="px-3 py-1.5 bg-surface-2 hover:bg-surface-2/80 border border-border/70 rounded-xl text-xs font-semibold text-text hover:text-accent transition-colors flex items-center gap-1.5"
                    >
                      <span>Console</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SIDE PANELS */}
        <div className="space-y-6">
          {/* GET STARTED CHECKLIST */}
          <div className="bg-surface/40 border border-border/50 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-highlight" />
                <h3 className="text-xs font-semibold text-text uppercase tracking-wider">Quick Start Guide</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-2 text-muted border border-border/50">
                {projects.length > 0 ? "1/3 Complete" : "0/3 Complete"}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  projects.length > 0 ? "bg-accent/20 border border-accent text-accent" : "bg-surface-2 border border-border/60 text-muted"
                }`}>
                  {projects.length > 0 ? <Check size={12} strokeWidth={3} /> : "1"}
                </div>
                <div className="min-w-0">
                  <div className={`font-medium ${projects.length > 0 ? "line-through text-muted" : "text-text"}`}>
                    Create your first project
                  </div>
                  <div className="text-[11px] text-muted">Isolates instances, users, and networks.</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-surface-2 border border-border/60 text-muted">
                  2
                </div>
                <div className="min-w-0">
                  {projects.length > 0 ? (
                    <Link href={`/dashboard/projects/${projects[0].id}/databases`} className="font-medium text-accent hover:underline">
                      Provision a database instance &rarr;
                    </Link>
                  ) : (
                    <div className="font-medium text-muted">Provision a database instance</div>
                  )}
                  <div className="text-[11px] text-muted">Deploy Postgres, Mongo, or Qdrant.</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-surface-2 border border-border/60 text-muted">
                  3
                </div>
                <div className="min-w-0">
                  {projects.length > 0 ? (
                    <Link href={`/dashboard/projects/${projects[0].id}/team`} className="font-medium text-accent hover:underline">
                      Invite collaborators &rarr;
                    </Link>
                  ) : (
                    <div className="font-medium text-muted">Invite collaborators</div>
                  )}
                  <div className="text-[11px] text-muted">Assign Owners, Admins, or Viewers.</div>
                </div>
              </div>
            </div>
          </div>

          {/* QUICK LINKS */}
          <div className="bg-surface/40 border border-border/50 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-semibold text-text uppercase tracking-wider pb-2 border-b border-border/30">
              Quick Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 p-3 bg-surface-2/60 hover:bg-surface-2 border border-border/50 rounded-lg text-text hover:text-accent transition-colors font-medium text-left"
              >
                <Plus size={15} className="text-accent shrink-0" />
                <span>New Project</span>
              </button>
              <Link 
                href="/dashboard/subscription"
                className="flex items-center gap-2 p-3 bg-surface-2/60 hover:bg-surface-2 border border-border/50 rounded-lg text-text hover:text-accent transition-colors font-medium text-left"
              >
                <CreditCard size={15} className="text-accent shrink-0" />
                <span>Billing</span>
              </Link>
              <Link 
                href="/docs"
                className="col-span-2 flex items-center justify-between p-3 bg-surface-2/60 hover:bg-surface-2 border border-border/50 rounded-lg text-text hover:text-accent transition-colors font-medium"
              >
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-accent shrink-0" />
                  <span>Developer API & Documentation</span>
                </div>
                <ArrowRight size={13} className="text-muted" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <CreateProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
