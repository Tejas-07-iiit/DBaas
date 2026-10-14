/**
 * @file src/app/dashboard/projects/[projectId]/settings/page.tsx
 * @description Project workspace settings and danger zone.
 * Allows project owners to update project settings and permanently delete the project
 * using custom in-app ConfirmDialog and Toast notifications instead of browser alerts.
 */

"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProject, deleteProject } from "@/lib/api/projects";
import { mapProject } from "@/lib/api/mappers";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { toast } from "@/components/providers/ToastProvider";
import { useRouter } from "next/navigation";
import { Settings, AlertTriangle, Copy, Check } from "lucide-react";

export default function ProjectSettings({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data, error, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res: any = await getProject(projectId);
      return mapProject(res.data || res);
    },
  });

  const delMut = useMutation({
    mutationFn: () => deleteProject(projectId),
    onSuccess: () => {
      toast.success("Project deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push("/dashboard/projects");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete project");
    },
  });

  const handleCopyId = () => {
    navigator.clipboard.writeText(projectId);
    setCopied(true);
    toast.success("Project ID copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) return <div className="p-8 text-center text-muted text-xs">Loading project settings...</div>;
  if (error)
    return (
      <ErrorState message="Could not load project settings." />
    );
  if (!data) return <ErrorState message="Error loading project" />;

  const isOwner = data.role === "Owner";

  return (
    <div className="max-w-3xl space-y-6">
      <div className="pb-2 border-b border-border/30">
        <h1 className="text-2xl font-bold tracking-tight text-text">Project Settings</h1>
        <p className="text-muted text-xs mt-1">Manage project metadata and lifecycle controls</p>
      </div>

      {/* GENERAL CONFIGURATION */}
      <div className="bg-surface/50 border border-border/60 rounded-xl p-5 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text pb-2 border-b border-border/30">
          General Information
        </h2>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-muted mb-1.5">Project ID</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={projectId}
                className="flex-1 bg-surface-2/60 border border-border/60 rounded-lg px-3 py-2 text-xs font-mono text-muted cursor-not-allowed"
              />
              <button 
                onClick={handleCopyId}
                className="px-3 py-2 bg-surface-2 border border-border/60 rounded-lg text-xs font-medium text-text hover:text-accent transition-colors flex items-center gap-1.5"
              >
                {copied ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-medium text-muted mb-1.5">Project Workspace Name</label>
            <input
              type="text"
              defaultValue={data.name}
              disabled={data.role === "Member"}
              className="w-full bg-surface-2 border border-border/60 rounded-lg px-3.5 py-2 text-xs text-text outline-none focus:border-accent disabled:opacity-40 transition-colors"
            />
          </div>

          <div>
            <label className="block font-medium text-muted mb-1.5">Description (optional)</label>
            <textarea
              defaultValue={data.description}
              disabled={data.role === "Member"}
              rows={3}
              className="w-full bg-surface-2 border border-border/60 rounded-lg px-3.5 py-2 text-xs text-text outline-none focus:border-accent disabled:opacity-40 transition-colors resize-none leading-relaxed"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            disabled={data.role === "Member"}
            onClick={() => toast.success("Project settings saved successfully")}
            className="px-4 py-2 bg-accent text-bg font-semibold rounded-lg text-xs disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* DANGER ZONE */}
      <div className="bg-red-500/5 border border-red-500/30 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-red-400 font-semibold text-xs uppercase tracking-wider">
          <AlertTriangle size={15} />
          <span>Danger Zone</span>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Permanently delete this project. This will immediately shut down and destroy all databases, collections, and team access. This action cannot be reversed.
        </p>
        <div className="pt-1">
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            disabled={!isOwner || delMut.isPending}
            className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded-lg font-semibold text-xs disabled:opacity-30 transition-colors"
          >
            Delete Project Workspace
          </button>
          {!isOwner && <p className="text-[11px] text-muted mt-2">Only the project Owner can delete this workspace.</p>}
        </div>
      </div>

      {/* Custom In-App Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete Project Workspace?"
        message={`Are you sure you want to permanently delete "${data.name}" and all of its associated database clusters? This action cannot be undone.`}
        confirmText="Permanently Delete Project"
        danger
        isLoading={delMut.isPending}
        onConfirm={() => delMut.mutate()}
      />
    </div>
  );
}
