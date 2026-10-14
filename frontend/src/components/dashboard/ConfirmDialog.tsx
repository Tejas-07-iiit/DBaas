/**
 * @file src/components/dashboard/ConfirmDialog.tsx
 * @description Accessible custom modal dialog for destructive or critical confirmations.
 * Replaces default browser confirm() and alert() popups with sleek in-app UI.
 */

"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
  requireType?: string;
  isLoading?: boolean;
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
  isLoading = false,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTyped("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isTypeValid = requireType ? typed.trim().toLowerCase() === requireType.trim().toLowerCase() : true;
  const isSubmitDisabled = !isTypeValid || isLoading;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isSubmitDisabled) {
      onConfirm();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={isLoading ? undefined : onClose}
    >
      <div
        className="bg-surface border border-border/70 p-6 rounded-xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {danger && (
              <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
            )}
            <div>
              <h2 className={`text-base font-semibold ${danger ? "text-red-400" : "text-text"}`}>
                {title}
              </h2>
            </div>
          </div>
          {!isLoading && (
            <button
              onClick={onClose}
              className="text-muted hover:text-text p-1 rounded-lg transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <p className="text-sm text-muted mb-6 leading-relaxed">{message}</p>

        {requireType ? (
          <form onSubmit={handleSubmit} className="mb-6">
            <label className="block text-xs font-medium text-muted mb-2">
              Type <span className="text-text font-semibold font-mono bg-surface-2 px-1.5 py-0.5 rounded">{requireType}</span> to confirm:
            </label>
            <input
              type="text"
              autoFocus
              value={typed}
              placeholder={requireType}
              onChange={(e) => setTyped(e.target.value)}
              className="w-full bg-surface-2 border border-border/50 rounded-lg px-3 py-2 text-sm font-mono text-text outline-none focus:border-red-500 transition-colors"
            />
          </form>
        ) : null}

        <div className="flex justify-end gap-3 pt-4 border-t border-border/30">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm text-muted hover:text-text hover:bg-surface-2 font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSubmitDisabled}
            className={`flex items-center gap-2 px-4 py-2 font-medium rounded-lg text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              danger
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-accent text-bg hover:opacity-90"
            }`}
          >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            <span>{isLoading ? "Processing..." : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
