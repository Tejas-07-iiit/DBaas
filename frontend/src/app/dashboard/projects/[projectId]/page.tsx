/**
 * @file src/app/dashboard/projects/[projectId]/page.tsx
 * @description Project workspace overview dashboard.
 * Summarizes databases, active team members, and direct quick-navigation cards.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { getProject } from "@/lib/api/projects";
import { mapProject } from "@/lib/api/mappers";
import { listDatabases } from "@/lib/api/databases";
import { listMembers } from "@/lib/api/members";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { RoleBadge } from "@/components/dashboard/RoleBadge";
import Link from "next/link";
import { use, useState } from "react";
import { 
  Database, Users, Settings, Activity, ArrowRight, Plus, 
  Copy, Check, ShieldCheck, Calendar, Layers
} from "lucide-react";
import { toast } from "@/components/providers/ToastProvider";
import { CreateDatabaseModal } from "@/components/dashboard/CreateDatabaseModal";

export default function ProjectOverview({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const dbQuery = useQuery({ queryKey: ["databases", projectId], queryFn: () => listDatabases(projectId) });
  const memQuery = useQuery({ queryKey: ["members", projectId], queryFn: () => listMembers(projectId) });
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res: any = await getProject(projectId);
      return mapProject(res.data || res);
    },
    retry: false
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
          <button 
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-bg font-semibold text-xs rounded-lg hover:opacity-90 transition-opacity shadow-sm"
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
        </div>
      </div>

      {data.description && (
        <p className="text-muted text-xs leading-relaxed max-w-3xl">{data.description}</p>
      )}
      
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

      {/* QUICK WORKSPACE NAVIGATION CARDS */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">Project Services</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link 
            href={`/dashboard/projects/${projectId}/databases`}
            className="p-5 bg-surface/50 hover:bg-surface-2/40 border border-border/50 hover:border-accent/40 rounded-xl transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border/60 flex items-center justify-center text-accent mb-4 group-hover:border-accent transition-colors">
              <Database size={20} />
            </div>
            <h3 className="font-semibold text-sm text-text group-hover:text-accent transition-colors mb-1">
              Database Instances
            </h3>
            <p className="text-xs text-muted leading-relaxed mb-4">
              Provision, configure, and monitor PostgreSQL, MongoDB, and Qdrant clusters.
            </p>
            <span className="text-xs font-semibold text-accent flex items-center gap-1">
              <span>View Databases ({dbList.length})</span>
              <ArrowRight size={13} />
            </span>
          </Link>

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
