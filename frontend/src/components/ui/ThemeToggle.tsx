"use client";

import { useEffect, useState, useRef } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { tokenStorage } from "@/lib/auth/tokenStorage";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ThemeToggleProps {
  variant?: "icon" | "dropdown" | "segmented";
  className?: string;
}

export function ThemeToggle({ variant = "dropdown", className = "" }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const checkAuth = () => {
      setIsLoggedIn(!!tokenStorage.getAccessToken());
    };
    checkAuth();
    window.addEventListener("storage", checkAuth);
    window.addEventListener("dbaas_auth_change", checkAuth);
    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("dbaas_auth_change", checkAuth);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!mounted || !isLoggedIn) {
    return null;
  }

  const isLight = resolvedTheme === "light";

  if (variant === "segmented") {
    return (
      <div className={`inline-flex items-center p-1 bg-surface-elevated border border-border rounded-xl gap-1 ${className}`}>
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            theme === "light"
              ? "bg-surface text-primary-light shadow-sm border border-border/80"
              : "text-muted hover:text-foreground"
          }`}
          title="Light Mode"
        >
          <Sun size={14} className={theme === "light" ? "text-primary-light" : ""} />
          <span>Light</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            theme === "dark"
              ? "bg-surface text-primary-light shadow-sm border border-border/80"
              : "text-muted hover:text-foreground"
          }`}
          title="Dark Mode"
        >
          <Moon size={14} className={theme === "dark" ? "text-primary-light" : ""} />
          <span>Dark</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme("system")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            theme === "system"
              ? "bg-surface text-primary-light shadow-sm border border-border/80"
              : "text-muted hover:text-foreground"
          }`}
          title="System Sync"
        >
          <Monitor size={14} className={theme === "system" ? "text-primary-light" : ""} />
          <span>System</span>
        </button>
      </div>
    );
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={() => setTheme(isLight ? "dark" : "light")}
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-elevated transition-colors border border-transparent hover:border-border ${className}`}
        aria-label="Toggle theme"
        title={`Switch to ${isLight ? "Dark" : "Light"} theme`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isLight ? (
            <motion.div
              key="sun"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Sun size={16} className="text-amber-500" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Moon size={16} className="text-primary-light" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    );
  }

  // Default: dropdown button
  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-elevated transition-colors border border-border/50 hover:border-border"
        aria-label="Theme options"
        title={`Current: ${theme} theme`}
      >
        {isLight ? (
          <Sun size={15} className="text-amber-500" />
        ) : (
          <Moon size={15} className="text-primary-light" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 mt-2 w-36 bg-surface border border-border rounded-xl p-1 shadow-xl z-50 text-xs"
          >
            <button
              type="button"
              onClick={() => { setTheme("light"); setOpen(false); }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                theme === "light"
                  ? "bg-surface-elevated text-primary-light font-medium"
                  : "text-muted hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              <span className="flex items-center gap-2">
                <Sun size={13} className="text-amber-500" />
                Light
              </span>
              {theme === "light" && <Check size={12} className="text-primary-light" />}
            </button>

            <button
              type="button"
              onClick={() => { setTheme("dark"); setOpen(false); }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                theme === "dark"
                  ? "bg-surface-elevated text-primary-light font-medium"
                  : "text-muted hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              <span className="flex items-center gap-2">
                <Moon size={13} className="text-primary-light" />
                Dark
              </span>
              {theme === "dark" && <Check size={12} className="text-primary-light" />}
            </button>

            <button
              type="button"
              onClick={() => { setTheme("system"); setOpen(false); }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                theme === "system"
                  ? "bg-surface-elevated text-primary-light font-medium"
                  : "text-muted hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              <span className="flex items-center gap-2">
                <Monitor size={13} className="text-muted" />
                System
              </span>
              {theme === "system" && <Check size={12} className="text-primary-light" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
