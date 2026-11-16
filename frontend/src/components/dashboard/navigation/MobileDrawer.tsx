/**
 * @file src/components/dashboard/navigation/MobileDrawer.tsx
 * @description Mobile slide-in navigation drawer for M-DBaaS.
 * 
 * Supports all 3 contextual navigation modes matching the desktop sidebar:
 * 1. Platform Mode (All Projects, Settings, Billing & Plans, FAQ, Support & Help)
 * 2. Project Mode (Project Overview, Team & Access, Resource Quotas, Project Settings)
 * 3. Database Mode (Overview, Data Explorer, Connection, Metrics, Logs, Events, Settings)
 */

"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { 
  Database, Activity, Users, Gauge, Settings, 
  FolderKanban, CreditCard, Shield, 
  HelpCircle, X, ArrowLeft, Layers, Terminal, 
  Radio, FileText, History, LifeBuoy, Mail
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMyPendingInvitations } from "@/lib/api/invitations";

export interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projects: any[];
  activeProject: any | null;
  activeProjectId: string | null;
  activeDatabaseId: string | null;
  activeDatabase: any | null;
  user: any;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
}

export function MobileDrawer({
  isOpen,
  onClose,
  activeProject,
  activeProjectId,
  activeDatabaseId,
  activeDatabase,
  user,
}: MobileDrawerProps) {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "Overview";

  const isDatabaseMode = Boolean(activeProjectId && activeDatabaseId);
  const isProjectMode = Boolean(activeProjectId && !activeDatabaseId);
  const isPlatformMode = !activeProjectId;

  // Query pending invitations sent to the user's email
  const { data: myPendingInv = [] } = useQuery({
    queryKey: ["my-pending-invitations"],
    queryFn: getMyPendingInvitations,
    enabled: isOpen && !!user?.email,
    refetchInterval: 10000,
  });
  const pendingInvCount = Array.isArray(myPendingInv) ? myPendingInv.length : 0;

  if (!isOpen) return null;

  const NavItem = ({
    href,
    icon: Icon,
    label,
    active,
    badge,
  }: {
    href: string;
    icon: any;
    label: string;
    active: boolean;
    badge?: number | null;
  }) => {
    return (
      <Link
        href={href}
        onClick={onClose}
        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
          active
            ? "bg-surface-elevated text-primary-light font-semibold shadow-xs"
            : "text-foreground-muted hover:text-foreground hover:bg-surface-hover/60"
        }`}
      >
        {active && (
          <div className="absolute left-1 top-2 bottom-2 w-1 bg-primary-light rounded-full" />
        )}
        <Icon
          size={16}
          className={`shrink-0 transition-colors ${
            active ? "text-primary-light" : "text-foreground-muted group-hover:text-foreground"
          }`}
        />
        <span className="truncate flex-1 tracking-tight">{label}</span>
        {typeof badge === "number" && badge > 0 && (
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono leading-none">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden flex" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <aside className="relative w-[280px] max-w-[85vw] bg-sidebar border-r border-border flex flex-col justify-between h-full z-10 p-3 shadow-2xl overflow-y-auto">
        <div className="flex flex-col min-h-0 flex-1">
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border/40 mb-3 shrink-0">
            <Link
              href="/dashboard/projects"
              onClick={onClose}
              className="flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-xl bg-primary-subtle border border-primary-light/30 flex items-center justify-center text-primary-light">
                <Database size={16} />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-base tracking-tight text-foreground">
                  DBaaS
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-primary-subtle border border-primary-light/25 text-primary-light font-semibold uppercase">
                  Cloud
                </span>
              </div>
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-foreground-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
          </div>

          {/* ========================================================= */}
          {/* MODE 1: PLATFORM MODE (No project selected)               */}
          {/* ========================================================= */}
          {isPlatformMode && (
            <div className="space-y-4 flex-1 overflow-y-auto hide-scrollbar pt-1">
              <nav className="space-y-0.5">
                <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-foreground-muted font-semibold select-none">
                  Platform
                </div>
                {/* 1. All Projects */}
                <NavItem
                  href="/dashboard/projects"
                  icon={FolderKanban}
                  label="All Projects"
                  active={pathname === "/dashboard/projects" || pathname === "/dashboard"}
                />
                {/* 2. Workspace Invitations */}
                <NavItem
                  href="/dashboard/invitations"
                  icon={Mail}
                  label="Invitations"
                  active={pathname.startsWith("/dashboard/invitations")}
                  badge={pendingInvCount}
                />
                {/* 3. Settings */}
                <NavItem
                  href="/dashboard/account"
                  icon={Settings}
                  label="Settings"
                  active={pathname.startsWith("/dashboard/account")}
                />
                {/* 3. Billing & Plans */}
                <NavItem
                  href="/dashboard/subscription"
                  icon={CreditCard}
                  label="Billing & Plans"
                  active={pathname.startsWith("/dashboard/subscription")}
                />
                {/* 4. FAQ */}
                <NavItem
                  href="/dashboard/faq"
                  icon={HelpCircle}
                  label="FAQ"
                  active={pathname === "/dashboard/faq"}
                />
                {/* 5. Support & Help */}
                <NavItem
                  href="/support"
                  icon={LifeBuoy}
                  label="Support & Help"
                  active={pathname === "/support"}
                />
              </nav>

              {/* Platform Admin */}
              {user?.isPlatformAdmin && (
                <nav className="space-y-0.5 pt-2 border-t border-border/40">
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-amber-500/90 font-semibold flex items-center gap-1.5 select-none">
                    <Shield size={11} />
                    <span>Platform Admin</span>
                  </div>
                  <NavItem
                    href="/dashboard/admin"
                    icon={Shield}
                    label="Admin Overview"
                    active={pathname === "/dashboard/admin"}
                  />
                  <NavItem
                    href="/dashboard/admin/users"
                    icon={Users}
                    label="Users Registry"
                    active={pathname.startsWith("/dashboard/admin/users")}
                  />
                  <NavItem
                    href="/dashboard/admin/projects"
                    icon={FolderKanban}
                    label="Tenant Projects"
                    active={pathname.startsWith("/dashboard/admin/projects")}
                  />
                  <NavItem
                    href="/dashboard/admin/databases"
                    icon={Database}
                    label="Cluster Fleet"
                    active={pathname.startsWith("/dashboard/admin/databases")}
                  />
                  <NavItem
                    href="/dashboard/admin/health"
                    icon={Activity}
                    label="System Health"
                    active={pathname.startsWith("/dashboard/admin/health")}
                  />
                </nav>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* MODE 2: PROJECT MODE (Viewing a project)                  */}
          {/* ========================================================= */}
          {isProjectMode && (
            <div className="space-y-4 flex-1 overflow-y-auto hide-scrollbar pt-1">
              {/* Back to All Projects */}
              <div className="pb-1 border-b border-border/40">
                <Link
                  href="/dashboard/projects"
                  onClick={onClose}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-foreground-muted hover:text-foreground hover:bg-surface-elevated rounded-xl transition-colors font-medium group"
                >
                  <ArrowLeft size={14} className="shrink-0" />
                  <span>All Projects</span>
                </Link>
              </div>

              {/* Project Title Card */}
              <div className="p-2.5 rounded-xl bg-surface/70 border border-border/80 shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-primary-subtle border border-primary-light/30 flex items-center justify-center font-bold text-xs text-primary-light shrink-0">
                    {activeProject?.name ? activeProject.name.slice(0, 2).toUpperCase() : "WS"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs text-foreground truncate">
                      {activeProject?.name || "Project Workspace"}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-foreground-muted font-mono mt-0.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          activeProject?.status === "RUNNING"
                            ? "bg-emerald-400"
                            : activeProject?.status === "PROVISIONING"
                            ? "bg-amber-400 animate-pulse"
                            : "bg-zinc-500"
                        }`}
                      />
                      <span>{activeProject?.status || "Active"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Workspace Items */}
              <nav className="space-y-0.5">
                <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-foreground-muted font-semibold select-none">
                  Project Workspace
                </div>
                <NavItem
                  href={`/dashboard/projects/${activeProjectId}`}
                  icon={Activity}
                  label="Project Overview"
                  active={pathname === `/dashboard/projects/${activeProjectId}`}
                />
                <NavItem
                  href={`/dashboard/projects/${activeProjectId}/team`}
                  icon={Users}
                  label="Team & Access"
                  active={pathname.startsWith(`/dashboard/projects/${activeProjectId}/team`)}
                />
                <NavItem
                  href={`/dashboard/projects/${activeProjectId}/usage`}
                  icon={Gauge}
                  label="Resource Quotas"
                  active={pathname.startsWith(`/dashboard/projects/${activeProjectId}/usage`)}
                />
                <NavItem
                  href={`/dashboard/projects/${activeProjectId}/settings`}
                  icon={Settings}
                  label="Project Settings"
                  active={pathname.startsWith(`/dashboard/projects/${activeProjectId}/settings`)}
                />
              </nav>
            </div>
          )}

          {/* ========================================================= */}
          {/* MODE 3: DATABASE MODE (Screenshot 2 consolidation)        */}
          {/* ========================================================= */}
          {isDatabaseMode && (
            <div className="space-y-4 flex-1 overflow-y-auto hide-scrollbar pt-1">
              {/* Back to Project */}
              <div className="pb-1 border-b border-border/40">
                <Link
                  href={`/dashboard/projects/${activeProjectId}`}
                  onClick={onClose}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-foreground-muted hover:text-foreground hover:bg-surface-elevated rounded-xl transition-colors font-medium group"
                >
                  <ArrowLeft size={14} className="shrink-0" />
                  <span className="truncate">
                    {activeProject?.name ? `Back to ${activeProject.name}` : "Back to Project"}
                  </span>
                </Link>
              </div>

              {/* Database Badge Card */}
              <div className="p-2.5 rounded-xl bg-surface/70 border border-border/80 shadow-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-primary-subtle border border-primary-light/30 flex items-center justify-center text-primary-light shrink-0">
                    <Database size={13} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs text-foreground truncate">
                      {activeDatabase?.name || "Database Instance"}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-foreground-muted font-mono mt-0.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          activeDatabase?.status === "running"
                            ? "bg-emerald-400"
                            : activeDatabase?.status === "provisioning"
                            ? "bg-amber-400 animate-pulse"
                            : "bg-zinc-500"
                        }`}
                      />
                      <span className="capitalize">{activeDatabase?.engine || "Cluster"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Database Tabs Navigation */}
              <nav className="space-y-0.5">
                <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-foreground-muted font-semibold select-none">
                  Database Console
                </div>
                <NavItem
                  href={`/dashboard/projects/${activeProjectId}/databases/${activeDatabaseId}?tab=Overview`}
                  icon={Activity}
                  label="Overview"
                  active={currentTab === "Overview"}
                />
                <NavItem
                  href={`/dashboard/projects/${activeProjectId}/databases/${activeDatabaseId}?tab=Data+Explorer`}
                  icon={Layers}
                  label="Data Explorer"
                  active={currentTab === "Data Explorer"}
                />
                <NavItem
                  href={`/dashboard/projects/${activeProjectId}/databases/${activeDatabaseId}?tab=Connection`}
                  icon={Terminal}
                  label="Connection"
                  active={currentTab === "Connection"}
                />
                <NavItem
                  href={`/dashboard/projects/${activeProjectId}/databases/${activeDatabaseId}?tab=Metrics`}
                  icon={Radio}
                  label="Metrics"
                  active={currentTab === "Metrics"}
                />
                <NavItem
                  href={`/dashboard/projects/${activeProjectId}/databases/${activeDatabaseId}?tab=Logs`}
                  icon={FileText}
                  label="Logs"
                  active={currentTab === "Logs"}
                />
                <NavItem
                  href={`/dashboard/projects/${activeProjectId}/databases/${activeDatabaseId}?tab=Events`}
                  icon={History}
                  label="Events"
                  active={currentTab === "Events"}
                />
                <NavItem
                  href={`/dashboard/projects/${activeProjectId}/databases/${activeDatabaseId}?tab=Settings`}
                  icon={Settings}
                  label="Settings"
                  active={currentTab === "Settings"}
                />
              </nav>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="pt-3 border-t border-border/40 shrink-0">
          <Link
            href="/support"
            onClick={onClose}
            className="flex items-center gap-2.5 px-3 py-2 text-xs text-foreground-muted hover:text-foreground hover:bg-surface-elevated rounded-xl transition-colors font-medium"
          >
            <LifeBuoy size={15} />
            <span>Help & Support</span>
          </Link>
        </div>
      </aside>
    </div>
  );
}
