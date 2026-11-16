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
      toast.success("Database created instantly on Project VM!");
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
      color: "border-violet-500/40 bg-violet-500/5 text-violet-400",
      activeBorder: "border-violet-500 bg-violet-500/10",
      dot: "bg-violet-400"
    },
    {
      id: "MongoDB",
      name: "MongoDB",
      tagline: "Document database for flexible JSON schemas",
      tag: "v7.0",
      color: "border-emerald-500/40 bg-emerald-500/5 text-emerald-400",
      activeBorder: "border-emerald-500 bg-emerald-500/10",
      dot: "bg-emerald-400"
    },
    {
      id: "Qdrant",
      name: "Qdrant",
      tagline: "Vector database for semantic search & AI embeddings",
      tag: "v1.8",
      color: "border-rose-500/40 bg-rose-500/5 text-rose-400",
      activeBorder: "border-rose-500 bg-rose-500/10",
      dot: "bg-rose-400"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4" onClick={handleClose}>
      <div className="bg-surface/95 border border-border/80 p-6 rounded-2xl w-full max-w-lg shadow-2xl backdrop-blur-xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <Database size={17} />
            </div>
            <div>
              <h2 className="text-base font-bold text-text">New Database Instance</h2>
              <p className="text-xs text-muted">Provision a dedicated managed instance</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-muted hover:text-text p-1.5 rounded-xl hover:bg-surface-2 transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Stepper indicator */}
        <div className="flex items-center justify-between py-4 border-b border-border/30 mb-5 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${step >= 1 ? "bg-primary text-white shadow-xs" : "bg-surface-2 text-muted"}`}>
              {step > 1 ? <Check size={12} strokeWidth={3} /> : "1"}
            </span>
            <span className={step === 1 ? "font-bold text-text" : "text-muted"}>Engine</span>
          </div>
          <div className="flex-1 h-px bg-border/40 mx-3"></div>
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${step >= 2 ? "bg-primary text-white shadow-xs" : "bg-surface-2 text-muted"}`}>
              {step > 2 ? <Check size={12} strokeWidth={3} /> : "2"}
            </span>
            <span className={step === 2 ? "font-bold text-text" : "text-muted"}>Settings</span>
          </div>
          <div className="flex-1 h-px bg-border/40 mx-3"></div>
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${step === 3 ? "bg-primary text-white shadow-xs" : "bg-surface-2 text-muted"}`}>
              3
            </span>
            <span className={step === 3 ? "font-bold text-text" : "text-muted"}>Deploy</span>
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
                    className={`cursor-pointer border p-3.5 rounded-xl flex items-center justify-between transition-all ${
                      isSelected 
                        ? `${e.activeBorder} shadow-sm ring-1 ring-primary-light/30` 
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
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "border-primary bg-primary text-white" : "border-border/60"}`}>
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
                className="px-5 py-2 text-sm bg-primary hover:bg-primary-hover text-white font-medium rounded-xl disabled:opacity-40 transition-colors shadow-sm"
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
                className="px-5 py-2 text-sm bg-primary hover:bg-primary-hover text-white font-medium rounded-xl disabled:opacity-40 transition-colors shadow-sm"
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
            <div className="bg-surface-2/50 border border-border/60 rounded-xl p-4 mb-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-border/30">
                <span className="text-muted">Engine</span>
                <span className="font-semibold text-text">{engine}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border/30">
                <span className="text-muted">Instance Name</span>
                <span className="font-mono font-semibold text-accent">{name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">Host Environment</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Dedicated Project VM (Instant &lt; 1s)
                </span>
              </div>
            </div>

            <p className="text-xs text-muted mb-4 leading-relaxed">
              💡 Your database provisions immediately inside your dedicated Project Host VM. Database credentials and connection endpoints are active instantly.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">
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
                className="flex items-center gap-2 px-5 py-2 text-sm bg-primary hover:bg-primary-hover text-white font-medium rounded-xl disabled:opacity-40 transition-colors shadow-sm"
              >
                {mut.isPending && <Loader2 size={14} className="animate-spin" />}
                {mut.isPending ? "Creating..." : "Create Database (Instant)"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}