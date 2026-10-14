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
  ArrowRight, ShieldCheck, Sparkles, Activity
} from "lucide-react";

function StatCard({ title, value, icon: Icon, isLoading, error, onRetry, linkHref, linkLabel }: any) {
  return (
    <div className="bg-surface/50 border border-border/50 rounded-xl p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-muted uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-surface-2 border border-border/50 flex items-center justify-center text-muted">
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
        <div className="text-2xl font-bold text-text tracking-tight mb-1">{value}</div>
      )}

      {linkHref && !isLoading && !error ? (
        <Link href={linkHref} className="text-xs text-accent hover:underline flex items-center gap-1 font-medium mt-2">
          <span>{linkLabel}</span>
          <ArrowRight size={12} />
        </Link>
      ) : (
        <div className="h-4 mt-2"></div>
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
  const recentProjects = [...projects].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  
  const lastProjectExists = lastOpenedId && projects.find((p: any) => p.id === lastOpenedId);

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/30">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Overview</h1>
          <p className="text-muted text-xs mt-1">Manage all cloud database workspaces, instances, and billing.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-bg font-semibold text-xs rounded-lg hover:opacity-90 transition-opacity self-start sm:self-auto shadow-sm"
        >
          <Plus size={15} />
          <span>New Project</span>
        </button>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          title="Total Projects" 
          value={projects.length} 
          icon={FolderKanban}
          isLoading={projQuery.isLoading} 
          error={projQuery.error} 
          onRetry={projQuery.refetch}
          linkHref="/dashboard/projects"
          linkLabel="View all projects"
        />
        <StatCard 
          title="Owned By You" 
          value={projectsYouOwn.length} 
          icon={ShieldCheck}
          isLoading={projQuery.isLoading} 
          error={projQuery.error} 
          onRetry={projQuery.refetch}
        />
        <StatCard 
          title="Subscription Tier" 
          value={subQuery.data?.planName || 'Free Sandbox'} 
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
        <div className="bg-surface/60 border border-accent/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center text-accent shrink-0">
              <FolderKanban size={20} />
            </div>
            <div>
              <div className="text-[10px] font-mono text-accent uppercase tracking-wider font-semibold">
                Quick Resume
              </div>
              <div className="font-bold text-sm text-text">{lastProjectExists.name}</div>
            </div>
          </div>
          <Link 
            href={`/dashboard/projects/${lastProjectExists.id}`} 
            className="px-4 py-2 bg-accent text-bg font-semibold text-xs rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5"
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
              <h2 className="text-sm font-semibold text-text uppercase tracking-wider">Recent Projects</h2>
            </div>
            <Link href="/dashboard/projects" className="text-xs text-accent hover:underline flex items-center gap-1">
              <span>View all ({projects.length})</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="bg-surface/40 border border-border/50 rounded-xl overflow-hidden">
            {projQuery.isLoading ? (
              <div className="p-12 text-center text-muted text-xs">Loading projects...</div>
            ) : projQuery.error ? (
              <ErrorState error={projQuery.error} onRetry={projQuery.refetch} />
            ) : recentProjects.length === 0 ? (
              <EmptyState 
                title="No projects provisioned yet" 
                description="Create your first project workspace to begin deploying MongoDB, PostgreSQL, and Qdrant clusters."
                action={
                  <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-accent text-bg rounded-lg text-xs font-semibold hover:opacity-90">
                    Create Project
                  </button>
                } 
              />
            ) : (
              <div className="divide-y divide-border/40">
                {recentProjects.map((p: any) => (
                  <div key={p.id} className="p-4 flex items-center justify-between hover:bg-surface-2/40 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <Link href={`/dashboard/projects/${p.id}`} className="font-semibold text-sm text-text hover:text-accent transition-colors">
                          {p.name}
                        </Link>
                        <RoleBadge role={p.role} />
                      </div>
                      <div className="text-xs text-muted font-mono">
                        Created {new Date(p.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Link 
                      href={`/dashboard/projects/${p.id}`} 
                      className="px-3 py-1.5 bg-surface-2 hover:bg-surface-2/80 border border-border/60 rounded-lg text-xs font-medium text-text hover:text-accent transition-colors flex items-center gap-1"
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
