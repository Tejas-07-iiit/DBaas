/**
 * @file src/app/dashboard/projects/[projectId]/settings/page.tsx
 * @description Project workspace settings and danger zone.
 * Allows project owners to update project settings and permanently delete the project.
 */

"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { getProject, deleteProject } from "@/lib/api/projects";
import { mapProject } from "@/lib/api/mappers";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { use } from "react";
import { useRouter } from "next/navigation";

export default function ProjectSettings({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();
  
  const { data, error, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res: any = await getProject(projectId);
      return mapProject(res.data || res);
    }
  });

  const delMut = useMutation({
    mutationFn: () => deleteProject(projectId),
    onSuccess: () => {
      alert("Project deleted");
      router.push("/dashboard/projects");
    }
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <ErrorState message="This permanently deletes the project and all of its databases and resources." />;
  if (!data) return <ErrorState message="Error loading project" />;

  const isOwner = data.role === 'Owner';

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>
      
      <div className="bg-surface/30 border border-border/50 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold mb-4">General</h2>
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2">Project Name</label>
          <input type="text" defaultValue={data.name} disabled={data.role === 'Member'} className="w-full bg-surface-2 border border-border rounded p-2 text-text" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2">Description</label>
          <textarea defaultValue={data.description} disabled={data.role === 'Member'} className="w-full bg-surface-2 border border-border rounded p-2 text-text h-24" />
        </div>
        <button disabled={data.role === 'Member'} className="px-4 py-2 bg-text text-bg rounded font-bold disabled:opacity-50">Save changes</button>
      </div>

      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
        <h2 className="text-lg font-bold text-red-400 mb-2">Danger Zone</h2>
        <p className="text-sm text-muted mb-4">Delete this project. This will also delete all databases within the project. This cannot be undone.</p>
        <button 
          onClick={() => { if(confirm(`Type ${data.name} to delete`)) delMut.mutate() }}
          disabled={!isOwner || delMut.isPending}
          className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded font-bold disabled:opacity-50"
        >
          Delete Project
        </button>
        {!isOwner && <p className="text-xs text-muted mt-2">Only Owners can do this.</p>}
      </div>
    </div>
  );
}
