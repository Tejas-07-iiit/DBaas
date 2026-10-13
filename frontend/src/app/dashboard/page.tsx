
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
import { Check, FolderKanban, Plus, FileText, Database, CreditCard } from "lucide-react";

function StatCard({ title, value, isLoading, error, onRetry, linkHref, linkLabel }: any) {
  return (
    <div className="bg-surface-2/30 border border-border/50 rounded-xl p-6 flex flex-col justify-between min-h-[120px]">
      <div className="text-xs font-mono text-muted uppercase tracking-widest mb-2">{title}</div>
      
      {isLoading ? (
        <div className="animate-pulse bg-surface-2 h-8 w-24 rounded"></div>
      ) : error ? (
        <div className="text-sm text-red-400">
          Unavailable <button onClick={onRetry} className="underline ml-2">Retry</button>
        </div>
      ) : (
        <div className="text-3xl font-bold text-text">{value}</div>
      )}

      {linkHref && !isLoading && !error && (
        <Link href={linkHref} className="text-xs text-accent hover:underline mt-4">{linkLabel}</Link>
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
    <div className="animate-in fade-in duration-500 max-w-6xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {firstName}</h1>
        <p className="text-muted">Here is an overview of your projects and plan.</p>
      </header>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Projects" 
          value={projects.length} 
          isLoading={projQuery.isLoading} 
          error={projQuery.error} 
          onRetry={projQuery.refetch}
        />
        <StatCard 
          title="Projects you own" 
          value={projectsYouOwn.length} 
          isLoading={projQuery.isLoading} 
          error={projQuery.error} 
          onRetry={projQuery.refetch}
        />
        <StatCard 
          title="Your plan" 
          value={subQuery.data?.planName || 'No active plan'} 
          isLoading={subQuery.isLoading} 
          error={subQuery.error} 
          onRetry={subQuery.refetch}
          linkHref="/dashboard/subscription"
          linkLabel="View plans"
        />
      </div>

      {/* STRIP */}
      {lastProjectExists && (
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-accent/20 flex items-center justify-center text-accent"><FolderKanban size={16} /></div>
            <div>
              <div className="text-xs text-accent font-mono">CONTINUE WHERE YOU LEFT OFF</div>
              <div className="font-bold">{lastProjectExists.name}</div>
            </div>
          </div>
          <Link href={`/dashboard/projects/${lastProjectExists.id}`} className="px-4 py-2 bg-accent text-bg font-bold text-sm rounded">Open project</Link>
        </div>
      )}

      {/* 2-COL LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* PROJECTS PANEL */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Your projects</h2>
            <button onClick={() => setIsModalOpen(true)} className="text-accent text-sm flex items-center gap-1 hover:underline"><Plus size={16}/> New project</button>
          </div>

          <div className="bg-surface/30 border border-border/50 rounded-xl overflow-hidden">
            {projQuery.isLoading ? (
              <div className="p-12 text-center text-muted">Loading projects...</div>
            ) : projQuery.error ? (
              <ErrorState error={projQuery.error} onRetry={projQuery.refetch} />
            ) : recentProjects.length === 0 ? (
              <EmptyState 
                title="Create your first project" 
                action={<button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-text text-bg rounded mt-4">New Project</button>} 
              />
            ) : (
              <div className="flex flex-col divide-y divide-border/50">
                {recentProjects.map((p: any) => (
                  <div key={p.id} className="p-4 flex items-center justify-between hover:bg-surface-2/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <Link href={`/dashboard/projects/${p.id}`} className="font-bold text-text hover:text-accent transition-colors">{p.name}</Link>
                        <RoleBadge role={p.role} />
                      </div>
                      <div className="text-xs font-mono text-muted">Created {new Date(p.createdAt).toLocaleDateString()}</div>
                    </div>
                    <Link href={`/dashboard/projects/${p.id}`} className="text-sm text-accent hover:underline">Open</Link>
                  </div>
                ))}
                <div className="p-3 bg-surface-2/30 text-center border-t border-border/50">
                  <Link href="/dashboard/projects" className="text-xs font-mono text-muted uppercase tracking-widest hover:text-text transition-colors">View all projects &rarr;</Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SIDE PANELS */}
        <div className="flex flex-col gap-8">
          
          {/* CHECKLIST */}
          <div>
            <h2 className="text-lg font-bold mb-4">Get started</h2>
            <div className="bg-surface/30 border border-border/50 rounded-xl p-4 flex flex-col gap-4">
              
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${projects.length > 0 ? 'bg-accent/20 border-accent text-accent' : 'border-border/50 text-muted'}`}>
                  {projects.length > 0 ? <Check size={12} /> : <span className="text-xs">1</span>}
                </div>
                <div className={`text-sm ${projects.length > 0 ? 'line-through text-muted' : 'text-text'}`}>Create a project</div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center border border-border/50 text-muted text-xs">2</div>
                {projects.length > 0 ? (
                  <Link href={`/dashboard/projects/${projects[0].id}/databases`} className="text-sm text-text hover:text-accent hover:underline">Create a database</Link>
                ) : (
                  <div className="text-sm text-muted">Create a database</div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center border border-border/50 text-muted text-xs">3</div>
                {projects.length > 0 ? (
                  <Link href={`/dashboard/projects/${projects[0].id}/team`} className="text-sm text-text hover:text-accent hover:underline">Invite your team</Link>
                ) : (
                  <div className="text-sm text-muted">Invite your team</div>
                )}
              </div>

            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div>
            <h2 className="text-lg font-bold mb-4">Quick actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setIsModalOpen(true)} className="flex flex-col items-center justify-center gap-2 p-4 bg-surface-2 border border-border/50 rounded-xl hover:border-accent/50 hover:text-accent transition-colors text-xs font-bold text-muted">
                <Plus size={20} /> New project
              </button>
              <Link href="/dashboard/subscription" className="flex flex-col items-center justify-center gap-2 p-4 bg-surface-2 border border-border/50 rounded-xl hover:border-accent/50 hover:text-accent transition-colors text-xs font-bold text-muted">
                <CreditCard size={20} /> View plans
              </Link>
              <Link href="/docs" className="col-span-2 flex items-center justify-center gap-2 p-4 bg-surface-2 border border-border/50 rounded-xl hover:border-accent/50 hover:text-accent transition-colors text-xs font-bold text-muted">
                <FileText size={16} /> Read the docs
              </Link>
            </div>
          </div>

        </div>
      </div>

      <CreateProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
