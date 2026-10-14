/**
 * @file src/components/dashboard/CreateDatabaseModal.tsx
 * @description 3-step modal wizard for provisioning new database instances:
 * Step 1: Select Database Engine (PostgreSQL, MongoDB, or Qdrant)
 * Step 2: Configure Database Name (slug sanitized)
 * Step 3: Review configuration & submit provisioning request
 */

"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDatabase } from "@/lib/api/databases";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "@/components/providers/ToastProvider";
import { X, Loader2, Database, Check } from "lucide-react";

interface CreateDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export function CreateDatabaseModal({ isOpen, onClose, projectId }: CreateDatabaseModalProps) {
  const [step, setStep] = useState(1);
  const [engine, setEngine] = useState("");
  const [name, setName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPlanError, setIsPlanError] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const mut = useMutation({
    mutationFn: () => createDatabase(projectId, { name, engine }),
    onSuccess: (res: any) => {
      const dbId = res.data?.id || res.id;
      toast.success("Database provisioning initiated!");
      queryClient.invalidateQueries({ queryKey: ["databases", projectId] });
      router.push(`/dashboard/projects/${projectId}/databases/${dbId}`);
      onClose();
      reset();
    },
    onError: (err: any) => {
      const msg = err?.message || "Failed to create database";
      setErrorMsg(msg);
      toast.error(msg);
      if (err.status === 403 || msg.toLowerCase().includes("plan")) {
        setIsPlanError(true);
      }
    }
  });

  const reset = () => { 
    setStep(1); 
    setEngine(""); 
    setName(""); 
    setErrorMsg(""); 
    setIsPlanError(false); 
  };
  
  const handleClose = () => { 
    reset(); 
    onClose(); 
  };

  if (!isOpen) return null;

  const engines = [
    {
      id: "PostgreSQL",
      name: "PostgreSQL",
      tagline: "Relational database with SQL & ACID compliance",
      tag: "v16.2",
      color: "border-[#4C8DFF]/40 bg-[#4C8DFF]/5 text-[#4C8DFF]",
      activeBorder: "border-[#4C8DFF] bg-[#4C8DFF]/10",
      dot: "bg-[#4C8DFF]"
    },
    {
      id: "MongoDB",
      name: "MongoDB",
      tagline: "Document database for flexible JSON schemas",
      tag: "v7.0",
      color: "border-[#3FCF6D]/40 bg-[#3FCF6D]/5 text-[#3FCF6D]",
      activeBorder: "border-[#3FCF6D] bg-[#3FCF6D]/10",
      dot: "bg-[#3FCF6D]"
    },
    {
      id: "Qdrant",
      name: "Qdrant",
      tagline: "Vector database for semantic search & AI embeddings",
      tag: "v1.8",
      color: "border-[#FF4D8D]/40 bg-[#FF4D8D]/5 text-[#FF4D8D]",
      activeBorder: "border-[#FF4D8D] bg-[#FF4D8D]/10",
      dot: "bg-[#FF4D8D]"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={handleClose}>
      <div className="bg-surface border border-border/80 p-6 rounded-xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-surface-2 border border-border/60 flex items-center justify-center text-accent">
              <Database size={16} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text">New Database Instance</h2>
              <p className="text-xs text-muted">Provision a dedicated managed instance</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-muted hover:text-text p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Stepper indicator */}
        <div className="flex items-center justify-between py-4 border-b border-border/30 mb-5 text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${step >= 1 ? "bg-accent text-bg" : "bg-surface-2 text-muted"}`}>
              {step > 1 ? <Check size={12} strokeWidth={3} /> : "1"}
            </span>
            <span className={step === 1 ? "font-semibold text-text" : "text-muted"}>Engine</span>
          </div>
          <div className="flex-1 h-px bg-border/40 mx-3"></div>
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${step >= 2 ? "bg-accent text-bg" : "bg-surface-2 text-muted"}`}>
              {step > 2 ? <Check size={12} strokeWidth={3} /> : "2"}
            </span>
            <span className={step === 2 ? "font-semibold text-text" : "text-muted"}>Settings</span>
          </div>
          <div className="flex-1 h-px bg-border/40 mx-3"></div>
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${step === 3 ? "bg-accent text-bg" : "bg-surface-2 text-muted"}`}>
              3
            </span>
            <span className={step === 3 ? "font-semibold text-text" : "text-muted"}>Deploy</span>
          </div>
        </div>
        
        {/* Step 1: Engine Selection */}
        {step === 1 && (
          <div>
            <div className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Select Engine Architecture</div>
            <div className="grid gap-2.5 mb-6">
              {engines.map(e => {
                const isSelected = engine === e.id;
                return (
                  <div 
                    key={e.id} 
                    onClick={() => setEngine(e.id)} 
                    className={`cursor-pointer border p-3.5 rounded-lg flex items-center justify-between transition-all ${
                      isSelected 
                        ? `${e.activeBorder} shadow-sm ring-1 ring-accent/30` 
                        : "border-border/50 bg-surface-2/30 hover:bg-surface-2 hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${e.dot}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-text">{e.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-2 border border-border/60 text-muted">
                            {e.tag}
                          </span>
                        </div>
                        <div className="text-xs text-muted mt-0.5">{e.tagline}</div>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "border-accent bg-accent text-bg" : "border-border/60"}`}>
                      {isSelected && <Check size={10} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-border/30">
              <button onClick={handleClose} className="px-4 py-2 text-sm text-muted hover:text-text font-medium transition-colors">
                Cancel
              </button>
              <button 
                onClick={() => setStep(2)} 
                disabled={!engine} 
                className="px-5 py-2 text-sm bg-accent text-bg font-semibold rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Name Configuration */}
        {step === 2 && (
          <div>
            <div className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Database Instance Identifier</div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-muted mb-1.5">Instance Name</label>
              <input 
                type="text" 
                value={name} 
                autoFocus
                onChange={e => setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} 
                className="w-full bg-surface-2 border border-border/60 rounded-lg px-3.5 py-2.5 text-sm text-text outline-none focus:border-accent font-mono transition-colors" 
                placeholder="production-cluster" 
                maxLength={40} 
              />
              <p className="text-[11px] text-muted mt-1.5">
                Lowercase letters, numbers, and hyphens only. Minimum 2 characters.
              </p>
            </div>

            <div className="p-3 bg-surface-2/40 border border-border/40 rounded-lg mb-6">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted">Selected Engine:</span>
                <span className="font-semibold text-text">{engine}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-border/30">
              <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-muted hover:text-text font-medium transition-colors">
                Back
              </button>
              <button 
                onClick={() => setStep(3)} 
                disabled={name.length < 2} 
                className="px-5 py-2 text-sm bg-accent text-bg font-semibold rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review and Provision */}
        {step === 3 && (
          <div>
            <div className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Review & Launch</div>
            <div className="bg-surface-2/50 border border-border/60 rounded-lg p-4 mb-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-border/30">
                <span className="text-muted">Engine</span>
                <span className="font-semibold text-text">{engine}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border/30">
                <span className="text-muted">Instance Name</span>
                <span className="font-mono font-semibold text-accent">{name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">Default Plan Allocation</span>
                <span className="text-text font-mono">1 vCPU · 1024 MB RAM · 5 GB NVMe</span>
              </div>
            </div>

            <p className="text-xs text-muted mb-4 leading-relaxed">
              Provisioning launches in seconds inside your dedicated project environment. You will receive real-time status telemetry.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg">
                {errorMsg}
                {isPlanError && (
                  <div className="mt-2">
                    <Link href="/dashboard/subscription" className="underline font-semibold text-accent" onClick={onClose}>
                      Upgrade Subscription Plan &rarr;
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-3 border-t border-border/30">
              <button onClick={() => setStep(2)} disabled={mut.isPending} className="px-4 py-2 text-sm text-muted hover:text-text font-medium transition-colors">
                Back
              </button>
              <button 
                onClick={() => mut.mutate()} 
                disabled={mut.isPending} 
                className="flex items-center gap-2 px-5 py-2 text-sm bg-accent text-bg font-semibold rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                {mut.isPending && <Loader2 size={14} className="animate-spin" />}
                {mut.isPending ? "Provisioning..." : "Launch Database"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}