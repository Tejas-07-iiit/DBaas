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
import { FolderKanban, Plus, Search, ArrowRight, LayoutGrid, List } from "lucide-react";

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
        <EmptyState 
          title="Create your first project" 
          description="Projects group your database clusters, team roles, and connection parameters."
          action={
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="px-4 py-2 bg-accent text-bg rounded-lg text-xs font-semibold hover:opacity-90"
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
          className="flex items-center gap-2 px-4 py-2 bg-accent text-bg font-semibold text-xs rounded-lg hover:opacity-90 transition-opacity self-start sm:self-auto shadow-sm"
        >
          <Plus size={15} />
          <span>New Project</span>
        </button>
      </div>

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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p: any) => (
            <div 
              key={p.id} 
              className="p-5 bg-surface/50 border border-border/50 rounded-xl hover:border-accent/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-3 gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-surface-2 border border-border/60 flex items-center justify-center text-accent shrink-0 group-hover:border-accent transition-colors">
                      <FolderKanban size={16} />
                    </div>
                    <h3 className="font-semibold text-base text-text truncate group-hover:text-accent transition-colors">
                      {p.name}
                    </h3>
                  </div>
                  <RoleBadge role={p.role} />
                </div>
                <p className="text-muted text-xs line-clamp-2 mb-6 h-8 leading-relaxed">
                  {p.description || "No project description provided."}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/30 text-xs">
                <span className="text-muted font-mono text-[11px]">
                  Created {new Date(p.createdAt).toLocaleDateString()}
                </span>
                <Link 
                  href={`/dashboard/projects/${p.id}`} 
                  className="text-xs text-accent font-semibold hover:underline flex items-center gap-1"
                >
                  <span>Console</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* VIEW: TABLE */
        <div className="bg-surface/40 border border-border/50 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-2 text-muted uppercase text-[10px] font-semibold tracking-wider border-b border-border/40">
              <tr>
                <th className="px-6 py-3">Project Name</th>
                <th className="px-6 py-3">Your Role</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.map((p: any) => (
                <tr key={p.id} className="hover:bg-surface-2/40 transition-colors">
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
                    <RoleBadge role={p.role} />
                  </td>
                  <td className="px-6 py-4 text-muted font-mono">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/dashboard/projects/${p.id}`} 
                      className="px-3 py-1.5 bg-surface-2 hover:bg-surface-2/80 border border-border/60 rounded-lg font-medium text-text hover:text-accent transition-colors inline-flex items-center gap-1"
                    >
                      <span>Open</span>
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
