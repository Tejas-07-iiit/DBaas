/**
 * @file src/components/dashboard/CreateProjectModal.tsx
 * @description Modal dialog for creating new project workspaces.
 * Interacts with React Query mutation to create the project, invalidate cache,
 * and navigate the user to the newly created project workspace.
 */

"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProject } from "@/lib/api/projects";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
  initialDescription?: string;
}

export function CreateProjectModal({ 
  isOpen, 
  onClose,
  initialName = "",
  initialDescription = ""
}: CreateProjectModalProps) {
  const [name, setName] = useState(initialName);
  const [desc, setDesc] = useState(initialDescription);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Update form fields when modal opens with prefilled props
  useEffect(() => {
    if (isOpen) {
      if (initialName) setName(initialName);
      if (initialDescription) setDesc(initialDescription);
    }
  }, [isOpen, initialName, initialDescription]);

  const mut = useMutation({
    mutationFn: () => createProject({ name, description: desc }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onClose();
      // Handle navigation to new project if response has ID
      const newId = res?.id || res?.data?.id;
      if (newId) router.push(`/dashboard/projects/${newId}`);
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-surface border border-border/70 p-6 rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold">Create a new project</h2>
          <button onClick={onClose} className="text-muted hover:text-text p-1 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-muted mb-1.5">Project name</label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="e.g. Production Cluster"
            className="w-full bg-surface-2 border border-border/50 rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-accent transition-colors"
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-muted mb-1.5">Description <span className="text-muted/60">(optional)</span></label>
          <textarea 
            value={desc} 
            onChange={e => setDesc(e.target.value)}
            className="w-full bg-surface-2 border border-border/50 rounded-lg px-3 py-2 text-sm text-text h-20 outline-none focus:border-accent transition-colors resize-none"
          />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border/30">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-muted hover:text-text hover:bg-surface-2 font-medium transition-colors">Cancel</button>
          <button 
            onClick={() => mut.mutate()} 
            disabled={!name || mut.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-bg font-medium rounded-lg text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {mut.isPending && <Loader2 size={14} className="animate-spin" />}
            {mut.isPending ? "Creating..." : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}
