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

const VM_PRESETS = [
  {
    id: "dev",
    name: "Developer",
    badge: "Recommended",
    cpu: 2,
    ram: 4096,
    storage: 20480,
    desc: "2 vCPU • 4 GB RAM • 20 GB NVMe",
  },
  {
    id: "pro",
    name: "Team Pro",
    badge: "High Performance",
    cpu: 4,
    ram: 8192,
    storage: 51200,
    desc: "4 vCPU • 8 GB RAM • 50 GB NVMe",
  },
  {
    id: "ent",
    name: "Enterprise",
    badge: "Max Power",
    cpu: 8,
    ram: 16384,
    storage: 102400,
    desc: "8 vCPU • 16 GB RAM • 100 GB NVMe",
  },
];

export function CreateProjectModal({ 
  isOpen, 
  onClose,
  initialName = "",
  initialDescription = ""
}: CreateProjectModalProps) {
  const [name, setName] = useState(initialName);
  const [desc, setDesc] = useState(initialDescription);
  const [selectedPreset, setSelectedPreset] = useState("dev");
  const [cpuCores, setCpuCores] = useState(2);
  const [ramMb, setRamMb] = useState(4096);
  const [storageMb, setStorageMb] = useState(20480);
  const [showCustom, setShowCustom] = useState(false);

  const queryClient = useQueryClient();
  const router = useRouter();

  // Update form fields when modal opens with prefilled props
  useEffect(() => {
    if (isOpen) {
      if (initialName) setName(initialName);
      if (initialDescription) setDesc(initialDescription);
    }
  }, [isOpen, initialName, initialDescription]);

  const selectPreset = (preset: typeof VM_PRESETS[0]) => {
    setSelectedPreset(preset.id);
    setCpuCores(preset.cpu);
    setRamMb(preset.ram);
    setStorageMb(preset.storage);
    setShowCustom(false);
  };

  const mut = useMutation({
    mutationFn: () => createProject({
      name,
      description: desc,
      cpuCores,
      ramMb,
      storageMb,
    }),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-surface/95 border border-border/80 p-6 rounded-2xl w-full max-w-lg shadow-2xl my-8 backdrop-blur-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-text">Create Project Workspace</h2>
            <p className="text-xs text-muted mt-0.5">Each project runs on a dedicated host VM supporting multiple databases.</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text p-1.5 rounded-xl hover:bg-surface-2 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Project name</label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="e.g. Analytics & Core Services"
            className="w-full bg-surface-2 border border-border/60 rounded-xl px-3.5 py-2.5 text-sm text-text outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Description <span className="text-muted/60 lowercase font-normal">(optional)</span></label>
          <textarea 
            value={desc} 
            onChange={e => setDesc(e.target.value)}
            placeholder="What will this project host?"
            className="w-full bg-surface-2 border border-border/60 rounded-xl px-3.5 py-2.5 text-sm text-text h-16 outline-none focus:border-accent transition-colors resize-none"
          />
        </div>

        {/* Dedicated VM Hardware Profile */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-text">Dedicated Host VM Specs</label>
            <button 
              type="button" 
              onClick={() => setShowCustom(!showCustom)} 
              className="text-xs text-accent hover:underline font-semibold"
            >
              {showCustom ? "Use Presets" : "Custom Specs"}
            </button>
          </div>

          {!showCustom ? (
            <div className="grid grid-cols-3 gap-2.5">
              {VM_PRESETS.map((p) => {
                const isSelected = selectedPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPreset(p)}
                    className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? "border-accent bg-accent/10 shadow-sm ring-1 ring-accent/30"
                        : "border-border/60 bg-surface-2/60 hover:border-border hover:bg-surface-2"
                    }`}
                  >
                    <span className="text-xs font-bold text-text">{p.name}</span>
                    <span className="text-[11px] text-muted font-mono mt-1">{p.desc}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3 p-4 bg-surface-2/50 rounded-xl border border-border/60">
              <div>
                <div className="flex justify-between text-xs text-muted mb-1 font-mono">
                  <span>vCPU Cores</span>
                  <span className="font-bold text-text">{cpuCores} vCPU</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="8" 
                  value={cpuCores} 
                  onChange={e => setCpuCores(parseInt(e.target.value, 10))}
                  className="w-full accent-accent"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-muted mb-1 font-mono">
                  <span>RAM</span>
                  <span className="font-bold text-text">{ramMb / 1024} GB ({ramMb} MB)</span>
                </div>
                <input 
                  type="range" 
                  min="2048" 
                  max="16384" 
                  step="1024"
                  value={ramMb} 
                  onChange={e => setRamMb(parseInt(e.target.value, 10))}
                  className="w-full accent-accent"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-muted mb-1 font-mono">
                  <span>Storage</span>
                  <span className="font-bold text-text">{Math.round(storageMb / 1024)} GB</span>
                </div>
                <input 
                  type="range" 
                  min="10240" 
                  max="102400" 
                  step="10240"
                  value={storageMb} 
                  onChange={e => setStorageMb(parseInt(e.target.value, 10))}
                  className="w-full accent-accent"
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-3.5 mb-5 rounded-xl bg-accent/10 border border-accent/20 text-xs text-text leading-relaxed">
          💡 <strong className="text-accent">Instant Provisioning:</strong> Once this project VM boots, all future databases created within this project provision in under 1 second.
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border/30">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs text-muted hover:text-text hover:bg-surface-2 font-medium transition-colors">Cancel</button>
          <button 
            onClick={() => mut.mutate()} 
            disabled={!name.trim() || mut.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl text-xs disabled:opacity-50 transition-colors shadow-sm"
          >
            {mut.isPending && <Loader2 size={14} className="animate-spin" />}
            {mut.isPending ? "Spinning up VM..." : "Create Project & Host VM"}
          </button>
        </div>
      </div>
    </div>
  );
}
