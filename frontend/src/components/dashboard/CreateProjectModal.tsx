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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface border border-border/50 p-6 rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Create a new project</h2>
        <div className="mb-4">
          <label className="block text-sm font-bold mb-1">Name</label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="e.g. Production Cluster"
            className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-text outline-none focus:border-accent"
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-bold mb-1">Description (optional)</label>
          <textarea 
            value={desc} 
            onChange={e => setDesc(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-text h-24 outline-none focus:border-accent"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded text-muted hover:text-text">Cancel</button>
          <button 
            onClick={() => mut.mutate()} 
            disabled={!name || mut.isPending}
            className="px-4 py-2 bg-text text-bg font-bold rounded disabled:opacity-50"
          >
            {mut.isPending ? "Creating..." : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}
