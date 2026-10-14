"use client";

import { useState, useEffect } from "react";
import { resetDemoData, getDemoConfig, updateDemoConfig } from "@/lib/demo/db";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { Wrench, X, ShieldAlert, WifiOff, AlertTriangle } from "lucide-react";

export function DemoToolsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [cfg, setCfg] = useState({ slowNetwork: false, errorMode: false, adminMode: false });
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (isOpen) setCfg(getDemoConfig());
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
        <div className="bg-surface border border-amber-500/40 p-6 rounded-xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/40">
            <div className="flex items-center gap-2 text-amber-500 font-semibold text-sm">
              <Wrench size={16} />
              <span>Demo Controls</span>
            </div>
            <button onClick={onClose} className="text-muted hover:text-text p-1 rounded-lg hover:bg-surface-2 transition-colors">
              <X size={16} />
            </button>
          </div>
          
          <p className="text-xs text-muted mb-5 leading-relaxed">
            All data in demo mode is isolated to your local browser storage. Use these switches to simulate edge cases.
          </p>
          
          <div className="flex flex-col gap-3 mb-6 bg-surface-2/40 p-3.5 rounded-lg border border-border/40">
            <label className="flex items-center justify-between text-xs cursor-pointer text-text hover:text-white transition-colors">
              <span className="flex items-center gap-2">
                <ShieldAlert size={14} className="text-amber-500" />
                <span className="font-medium">Platform Admin Mode</span>
              </span>
              <input 
                type="checkbox" 
                checked={cfg.adminMode} 
                onChange={e => {
                  const newCfg = { ...cfg, adminMode: e.target.checked };
                  setCfg(newCfg); 
                  updateDemoConfig(newCfg); 
                  window.location.reload();
                }} 
                className="accent-amber-500 w-4 h-4 rounded cursor-pointer" 
              />
            </label>

            <div className="h-px bg-border/30"></div>

            <label className="flex items-center justify-between text-xs cursor-pointer text-text hover:text-white transition-colors">
              <span className="flex items-center gap-2">
                <WifiOff size={14} className="text-muted" />
                <span>Simulate High Latency (1.5s)</span>
              </span>
              <input 
                type="checkbox" 
                checked={cfg.slowNetwork} 
                onChange={e => {
                  const newCfg = { ...cfg, slowNetwork: e.target.checked };
                  setCfg(newCfg); 
                  updateDemoConfig(newCfg);
                }} 
                className="accent-amber-500 w-4 h-4 rounded cursor-pointer" 
              />
            </label>

            <div className="h-px bg-border/30"></div>

            <label className="flex items-center justify-between text-xs cursor-pointer text-text hover:text-white transition-colors">
              <span className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-muted" />
                <span>Simulate Random 500 Errors</span>
              </span>
              <input 
                type="checkbox" 
                checked={cfg.errorMode} 
                onChange={e => {
                  const newCfg = { ...cfg, errorMode: e.target.checked };
                  setCfg(newCfg); 
                  updateDemoConfig(newCfg);
                }} 
                className="accent-amber-500 w-4 h-4 rounded cursor-pointer" 
              />
            </label>
          </div>

          <div className="space-y-2">
            <button 
              onClick={() => setConfirmReset(true)}
              className="w-full px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded-lg font-medium text-xs transition-colors"
            >
              Reset Mock Database & State
            </button>

            <button 
              onClick={onClose} 
              className="w-full px-4 py-2 border border-border/50 text-muted hover:text-text rounded-lg font-medium text-xs hover:bg-surface-2 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset Demo Data"
        message="Are you sure you want to reset all mock demo databases and projects? This action cannot be undone."
        confirmText="Reset Data"
        danger
        onConfirm={() => {
          resetDemoData();
          window.location.reload();
        }}
      />
    </>
  );
}
