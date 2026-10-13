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

function ProjectsContent() {
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  if (isLoading) return <div>Loading projects...</div>;
  if (error) return <ErrorState error={error} message="Could not load projects" onRetry={refetch} />;
  
  if (!data || data.length === 0) {
    return (
      <div>
        <EmptyState 
          title="Create your first project" 
          action={
            <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-text text-bg rounded font-bold">
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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Projects</h1>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-text text-bg rounded text-sm font-bold">
          New Project
        </button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((p: any) => (
          <div key={p.id} className="p-6 bg-surface-2/30 border border-border/50 rounded-xl hover:border-accent/50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg">{p.name}</h3>
              <RoleBadge role={p.role} />
            </div>
            <p className="text-muted text-sm line-clamp-2 mb-6 h-10">{p.description || 'No description'}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted font-mono">{new Date(p.createdAt).toLocaleDateString()}</span>
              <Link href={`/dashboard/projects/${p.id}`} className="text-accent hover:underline">Open &rarr;</Link>
            </div>
          </div>
        ))}
      </div>
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
    <Suspense fallback={<div className="p-8 text-muted">Loading projects...</div>}>
      <ProjectsContent />
    </Suspense>
  );
}
