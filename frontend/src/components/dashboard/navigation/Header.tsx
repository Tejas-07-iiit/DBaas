/**
 * @file src/components/dashboard/navigation/Header.tsx
 * @description Master application header across all authenticated `/dashboard/*` routes.
 * 
 * Layout:
 * - LEFT: Mobile menu toggle, Breadcrumbs (resolving real Project & Database names), Project Context indicator
 * - RIGHT: Demo simulator trigger (if enabled), ThemeToggle, AccountDropdown
 */

"use client";

import Link from "next/link";
import { ChevronRight, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AccountDropdown } from "./AccountDropdown";
import { isDemoEnabled } from "@/lib/auth/demo/demoConfig";
import { getDemoSession } from "@/lib/auth/demo/demoSession";

export interface HeaderProps {
  breadcrumbs: { label: string; href: string }[];
  activeProject: any | null;
  user: any;
  onLogout: () => Promise<void> | void;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  onOpenDemoTools?: () => void;
}

export function Header({
  breadcrumbs,
  activeProject,
  user,
  onLogout,
  mobileOpen,
  onToggleMobile,
  onOpenDemoTools,
}: HeaderProps) {
  const isDemo = isDemoEnabled() && getDemoSession();

  return (
    <header className="h-[60px] border-b border-border flex items-center px-4 sm:px-6 justify-between bg-surface/80 backdrop-blur-xl sticky top-0 z-10 shadow-xs">
      {/* LEFT: Mobile Toggle + Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobile}
          className="md:hidden p-1.5 text-foreground-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors shrink-0"
          aria-label={mobileOpen ? "Close navigation drawer" : "Open navigation drawer"}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* BREADCRUMB NAVIGATION */}
        <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs font-mono overflow-x-auto hide-scrollbar py-1">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <div key={crumb.href + idx} className="flex items-center gap-1.5 whitespace-nowrap">
                {idx > 0 && (
                  <ChevronRight size={13} className="text-foreground-muted/40 shrink-0" />
                )}
                {isLast ? (
                  <span className="font-semibold text-foreground max-w-[200px] sm:max-w-xs truncate">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-foreground-muted hover:text-foreground transition-colors max-w-[140px] sm:max-w-xs truncate"
                  >
                    {crumb.label}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* RIGHT: Context indicator + Demo Tools + ThemeToggle + AccountDropdown */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Project Context Host VM Status Indicator (sm+) */}
        {activeProject && (
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-elevated border border-border text-xs shadow-inner">
            <span
              className={`w-2 h-2 rounded-full ${
                activeProject.status === "RUNNING"
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)] animate-pulse"
                  : activeProject.status === "PROVISIONING"
                  ? "bg-amber-400 animate-pulse"
                  : "bg-zinc-500"
              }`}
            />
            <span className="font-mono text-[11px] text-foreground-muted flex items-center gap-1.5">
              <span>VM:</span>
              <span className="text-foreground font-semibold">
                {activeProject.status || "Active"}
              </span>
              {activeProject.internalIp && (
                <span className="text-foreground-muted/60">· {activeProject.internalIp}</span>
              )}
            </span>
          </div>
        )}

        {/* Demo Simulator Mode Pill */}
        {isDemo && onOpenDemoTools && (
          <button
            type="button"
            onClick={onOpenDemoTools}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-warning/10 border border-warning/30 text-warning text-[11px] font-semibold rounded-lg hover:bg-warning/20 transition-colors"
            title="Configure Demo Simulator"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
            <span>Demo Mode</span>
          </button>
        )}

        {/* Theme Switcher Dropdown */}
        <ThemeToggle variant="dropdown" />

        {/* Top-Right Account Menu Dropdown */}
        <AccountDropdown
          user={user}
          onLogout={onLogout}
          onOpenDemoTools={onOpenDemoTools}
        />
      </div>
    </header>
  );
}
