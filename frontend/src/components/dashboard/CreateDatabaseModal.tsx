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
      alert("Database is provisioning.");
      queryClient.invalidateQueries({ queryKey: ["databases", projectId] });
      router.push(`/dashboard/projects/${projectId}/databases/${dbId}`);
      onClose();
      reset();
    },
    onError: (err: any) => {
      if (err.status === 422 || err.status === 409) {
        setErrorMsg(err.body?.message || "Invalid name or duplicate");
      } else if (err.status === 403) {
        setErrorMsg(err.body?.message || "Plan limit reached.");
        if (err.body?.message?.toLowerCase().includes("plan")) setIsPlanError(true);
      } else {
        setErrorMsg("Failed to create database");
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4" onClick={handleClose}>
      <div className="bg-surface border border-border/50 p-6 rounded-xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-6">Create Database</h2>
        
        {/* Step 1: Engine Selection */}
        {step === 1 && (
          <div>
            <label className="block text-sm font-bold mb-4">Choose an engine</label>
            <div className="grid gap-3 mb-6">
              {[
                { id: 'PostgreSQL', c: 'border-[#336791]', bg: 'hover:bg-[#336791]/10', t: 'Relational data' },
                { id: 'MongoDB', c: 'border-[#47A248]', bg: 'hover:bg-[#47A248]/10', t: 'Document store' },
                { id: 'Qdrant', c: 'border-accent', bg: 'hover:bg-accent/10', t: 'Vector search' }
              ].map(e => (
                <div 
                  key={e.id} 
                  onClick={() => setEngine(e.id)} 
                  className={`cursor-pointer border p-4 rounded-lg flex items-center justify-between ${engine === e.id ? e.c + ' bg-surface-2' : 'border-border/50 ' + e.bg}`}
                >
                  <div className="font-bold">{e.id}</div>
                  <div className="text-xs text-muted">{e.t}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={handleClose} className="px-4 py-2 font-bold text-sm text-muted">Cancel</button>
              <button onClick={() => setStep(2)} disabled={!engine} className="px-4 py-2 font-bold text-sm bg-text text-bg rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        )}

        {/* Step 2: Name Configuration */}
        {step === 2 && (
          <div>
            <label className="block text-sm font-bold mb-2">Database name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} 
              className="w-full bg-surface-2 border border-border rounded px-4 py-2 text-text outline-none focus:border-accent mb-6" 
              placeholder="my-db" 
              maxLength={40} 
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setStep(1)} className="px-4 py-2 font-bold text-sm text-muted">Back</button>
              <button onClick={() => setStep(3)} disabled={name.length < 2} className="px-4 py-2 font-bold text-sm bg-text text-bg rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        )}

        {/* Step 3: Review and Provision */}
        {step === 3 && (
          <div>
            <div className="bg-surface-2 p-4 rounded mb-4">
              <div className="flex justify-between mb-2"><span className="text-muted text-sm">Engine</span><span className="font-bold">{engine}</span></div>
              <div className="flex justify-between"><span className="text-muted text-sm">Name</span><span className="font-bold">{name}</span></div>
            </div>
            <p className="text-xs text-muted mb-6">Creating a database takes a moment. You will see its status update.</p>
            {errorMsg && (
               <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded">
                 {errorMsg}
                 {isPlanError && <div className="mt-2"><Link href="/dashboard/subscription" className="underline font-bold text-accent" onClick={onClose}>View plans</Link></div>}
               </div>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => setStep(2)} className="px-4 py-2 font-bold text-sm text-muted">Back</button>
              <button onClick={() => mut.mutate()} disabled={mut.isPending} className="px-4 py-2 font-bold text-sm bg-accent text-bg rounded disabled:opacity-50">{mut.isPending ? "Creating..." : "Create"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}