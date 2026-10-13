/**
 * @file src/components/dashboard/ConfirmDialog.tsx
 * @description Accessible modal dialog for destructive or critical confirmations.
 * Supports typed confirmation input (e.g., typing resource name or "DELETE" to confirm).
 */

"use client";

import { useState } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
  requireType?: string;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  danger = false,
  requireType = "",
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState("");
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface border border-border/50 p-6 rounded-xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className={`text-xl font-bold mb-2 ${danger ? 'text-red-400' : 'text-text'}`}>{title}</h2>
        <p className="text-sm text-muted mb-6">{message}</p>
        
        {requireType && (
          <div className="mb-6">
            <label className="block text-xs font-bold text-muted mb-2 uppercase">Type &quot;{requireType}&quot; to confirm</label>
            <input 
              type="text" 
              value={typed} 
              onChange={e => setTyped(e.target.value)} 
              className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-text outline-none focus:border-red-500"
            />
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded text-muted hover:text-text text-sm font-bold">Cancel</button>
          <button 
            onClick={() => { onConfirm(); onClose(); }} 
            disabled={requireType ? typed !== requireType : false}
            className={`px-4 py-2 font-bold rounded text-sm disabled:opacity-50 ${danger ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-text text-bg hover:opacity-90'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
