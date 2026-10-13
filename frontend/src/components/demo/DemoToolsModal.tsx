"use client";
import { useState, useEffect } from "react";
import { resetDemoData, getDemoConfig, updateDemoConfig } from "@/lib/demo/db";

export function DemoToolsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [cfg, setCfg] = useState({ slowNetwork: false, errorMode: false, adminMode: false });

  useEffect(() => {
    if (isOpen) setCfg(getDemoConfig());
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface border border-amber-500/50 p-6 rounded-xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-amber-500">Demo Tools</h2>
        <p className="text-xs text-muted mb-6">Demo data lives only in this browser.</p>
        
        <div className="flex flex-col gap-4 mb-6">
          <label className="flex items-center gap-3 text-sm cursor-pointer text-text">
            <input type="checkbox" checked={cfg.adminMode} onChange={e => {
              const newCfg = { ...cfg, adminMode: e.target.checked };
              setCfg(newCfg); updateDemoConfig(newCfg); window.location.reload();
            }} className="accent-amber-500 w-4 h-4" />
            <span className="text-amber-500 font-bold">View as platform admin</span>
          </label>
          <label className="flex items-center gap-3 text-sm cursor-pointer text-text">
            <input type="checkbox" checked={cfg.slowNetwork} onChange={e => {
              const newCfg = { ...cfg, slowNetwork: e.target.checked };
              setCfg(newCfg); updateDemoConfig(newCfg);
            }} className="accent-amber-500 w-4 h-4" />
            Simulate slow network
          </label>
          <label className="flex items-center gap-3 text-sm cursor-pointer text-text">
            <input type="checkbox" checked={cfg.errorMode} onChange={e => {
              const newCfg = { ...cfg, errorMode: e.target.checked };
              setCfg(newCfg); updateDemoConfig(newCfg);
            }} className="accent-amber-500 w-4 h-4" />
            Simulate server errors (1 in 3)
          </label>
        </div>

        <button 
          onClick={() => { if (confirm("Reset demo data?")) { resetDemoData(); window.location.reload(); } }}
          className="w-full px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded font-bold mb-4 text-sm transition-colors"
        >
          Reset demo data
        </button>

        <button onClick={onClose} className="w-full px-4 py-2 border border-border/50 rounded font-bold text-sm hover:bg-surface-2 transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}
