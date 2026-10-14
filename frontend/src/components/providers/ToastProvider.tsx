/**
 * @file src/components/providers/ToastProvider.tsx
 * @description Modern, sleek in-app toast notification system to replace native browser alert() dialogs.
 * Provides accessible notifications with auto-dismiss, progress animations, and custom styling.
 */

"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
}

const ToastContext = createContext<ToastContextType | null>(null);

let globalShowToast: ((toast: Omit<Toast, "id">) => string) | null = null;

export const toast = {
  success: (message: string, title?: string) => {
    if (globalShowToast) return globalShowToast({ type: "success", message, title });
    console.log("[Toast Success]", message);
    return "";
  },
  error: (message: string, title?: string) => {
    if (globalShowToast) return globalShowToast({ type: "error", message, title });
    console.error("[Toast Error]", message);
    return "";
  },
  info: (message: string, title?: string) => {
    if (globalShowToast) return globalShowToast({ type: "info", message, title });
    console.log("[Toast Info]", message);
    return "";
  },
  warning: (message: string, title?: string) => {
    if (globalShowToast) return globalShowToast({ type: "warning", message, title });
    console.warn("[Toast Warning]", message);
    return "";
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, message, title, duration = 4000 }: Omit<Toast, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: Toast = { id, type, message, title, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string) => showToast({ type: "success", message, title }),
    [showToast]
  );

  const error = useCallback(
    (message: string, title?: string) => showToast({ type: "error", message, title }),
    [showToast]
  );

  const info = useCallback(
    (message: string, title?: string) => showToast({ type: "info", message, title }),
    [showToast]
  );

  const warning = useCallback(
    (message: string, title?: string) => showToast({ type: "warning", message, title }),
    [showToast]
  );

  useEffect(() => {
    globalShowToast = showToast;
    if (typeof window !== "undefined") {
      window.alert = (msg?: any) => {
        const text = typeof msg === "string" ? msg : String(msg ?? "");
        if (!text) return;
        const lower = text.toLowerCase();
        if (
          lower.includes("provision") ||
          lower.includes("success") ||
          lower.includes("created") ||
          lower.includes("deleted") ||
          lower.includes("renamed") ||
          lower.includes("copied") ||
          lower.includes("invited") ||
          lower.includes("updated")
        ) {
          showToast({ type: "success", message: text });
        } else if (
          lower.includes("fail") ||
          lower.includes("error") ||
          lower.includes("cannot") ||
          lower.includes("invalid") ||
          lower.includes("rejected")
        ) {
          showToast({ type: "error", message: text });
        } else {
          showToast({ type: "info", message: text });
        }
      };
    }
    return () => {
      globalShowToast = null;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider
      value={{ toasts, showToast, removeToast, success, error, info, warning }}
    >
      {children}
      {/* Toast Render Viewport - Top Right for instant visibility */}
      <div
        aria-live="polite"
        className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => {
          const isSuccess = t.type === "success";
          const isError = t.type === "error";
          const isWarning = t.type === "warning";
          const isInfo = t.type === "info";

          const borderColor = isSuccess
            ? "border-emerald-500/40"
            : isError
            ? "border-red-500/40"
            : isWarning
            ? "border-amber-500/40"
            : "border-accent/40";

          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3.5 p-4 rounded-2xl border ${borderColor} bg-surface/95 backdrop-blur-xl shadow-2xl text-xs transition-all duration-300 animate-in slide-in-from-top-4 fade-in`}
            >
              <div
                className={`shrink-0 p-2 rounded-xl flex items-center justify-center ${
                  isSuccess
                    ? "bg-emerald-500/15 text-emerald-400"
                    : isError
                    ? "bg-red-500/15 text-red-400"
                    : isWarning
                    ? "bg-amber-500/15 text-amber-400"
                    : "bg-accent/15 text-accent"
                }`}
              >
                {isSuccess && <CheckCircle2 size={18} />}
                {isError && <AlertCircle size={18} />}
                {isWarning && <AlertTriangle size={18} />}
                {isInfo && <Info size={18} />}
              </div>

              <div className="flex-1 pt-0.5">
                {t.title && (
                  <div className="font-bold text-text text-sm mb-0.5">{t.title}</div>
                )}
                <div className="text-text/90 font-medium leading-relaxed break-words text-xs">
                  {t.message}
                </div>
              </div>

              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-muted hover:text-text p-1.5 -mr-1 -mt-1 rounded-lg transition-colors hover:bg-surface-2"
                title="Dismiss"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (t: any) => toast.info(t.message, t.title),
      removeToast: () => {},
      success: toast.success,
      error: toast.error,
      info: toast.info,
      warning: toast.warning,
      toast,
    };
  }
  return { ...context, toast };
}
