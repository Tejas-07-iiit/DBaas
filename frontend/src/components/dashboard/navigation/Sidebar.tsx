/**
 * @file src/components/dashboard/navigation/Sidebar.tsx
 * @description Desktop persistent sidebar navigation for M-DBaaS.
 * 
 * Implements 3 strictly separated contextual navigation modes:
 * 1. PLATFORM MODE (when on platform pages):
 *    - All Projects
 *    - Settings
 *    - Billing & Plans
 *    - FAQ
 *    - Support & Help
 *    - (Platform Admin if isPlatformAdmin)
 * 2. PROJECT MODE (when viewing a project):
 *    - "← All Projects" return button
 *    - Project Overview
 *    - Team & Access
 *    - Resource Quotas
 *    - Project Settings
 *    (Databases removed from sidebar; selected directly from Project Overview)
 * 3. DATABASE MODE (when viewing a database):
 *    - "← Back to Project" return button
 *    - Database name, engine, status dot
 *    - Overview, Data Explorer, Connection, Metrics, Logs, Events, Settings (from Screenshot 2)
 */

"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { 
  Database, Activity, Users, Gauge, Settings, 
  FolderKanban, CreditCard, Shield, 
  PanelLeftClose, PanelLeftOpen, HelpCircle, ArrowLeft,
  Layers, Terminal, Radio, FileText, History, LifeBuoy,
  Mail
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMyPendingInvitations } from "@/lib/api/invitations";

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  projects: any[];
  activeProject: any | null;
  activeProjectId: string | null;
  activeDatabaseId: string | null;
  activeDatabase: any | null;
  user: any;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  activeProject,
  activeProjectId,
  activeDatabaseId,
  activeDatabase,
  user,
}: SidebarProps) {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "Overview";

  // Determine current mode
  const isDatabaseMode = Boolean(activeProjectId && activeDatabaseId);
  const isProjectMode = Boolean(activeProjectId && !activeDatabaseId);
  const isPlatformMode = !activeProjectId;

  // Query pending invitations sent to the user's email
  const { data: myPendingInv = [] } = useQuery({
    queryKey: ["my-pending-invitations"],
    queryFn: getMyPendingInvitations,
    enabled: !!user?.email,
    refetchInterval: 10000,
  });
  const pendingInvCount = Array.isArray(myPendingInv) ? myPendingInv.length : 0;

  // NavItem helper
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
        title={collapsed ? (badge ? `${label} (${badge} pending)` : label) : undefined}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative ${
          active
            ? "bg-surface-elevated text-primary-light font-semibold shadow-xs"
            : "text-foreground-muted hover:text-foreground hover:bg-surface-hover/60"
        }`}
      >
        {active && (
          <div className="absolute left-1 top-2 bottom-2 w-1 bg-primary-light rounded-full" />
        )}
        <div className="relative shrink-0 flex items-center justify-center">
          <Icon
            size={16}
            className={`transition-colors ${
              active
                ? "text-primary-light"
                : "text-foreground-muted group-hover:text-foreground"
            }`}
          />
          {collapsed && typeof badge === "number" && badge > 0 && (
            <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-2 ring-sidebar" />
          )}
        </div>
        {!collapsed && (
          <>
            <span className="truncate flex-1 tracking-tight">{label}</span>
            {typeof badge === "number" && badge > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono leading-none">
                {badge}
              </span>
            )}
          </>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={`${
        collapsed ? "w-[68px]" : "w-[260px]"
      } border-r border-border bg-sidebar flex flex-col justify-between hidden md:flex transition-all duration-200 select-none shrink-0 z-20 h-screen sticky top-0 shadow-lg`}
    >
      {/* Top and Scrollable Middle Area */}
      <div className="flex flex-col min-h-0 flex-1 overflow-y-auto hide-scrollbar p-3">
        {/* BRAND HEADER */}
        <div
          className={`flex items-center ${
            collapsed ? "justify-center" : "justify-between"
          } px-1 py-1 mb-3 shrink-0`}
        >
          {!collapsed ? (
            <Link href="/dashboard/projects" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-primary-subtle border border-primary-light/30 flex items-center justify-center text-primary-light group-hover:border-primary-light transition-colors shadow-xs">
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
          ) : (
            <div className="w-8 h-8 rounded-xl bg-primary-subtle border border-primary-light/30 flex items-center justify-center text-primary-light shadow-xs">
              <Database size={16} />
            </div>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="text-foreground-muted hover:text-foreground p-1.5 rounded-lg hover:bg-surface-elevated transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {/* ========================================================= */}
        {/* MODE 1: PLATFORM MODE (No project selected / Platform Level) */}
        {/* ========================================================= */}
        {isPlatformMode && (
          <div className="space-y-4">
            <nav className="space-y-0.5">
              {!collapsed && (
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-foreground-muted font-semibold select-none">
                  Platform
                </div>
              )}
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

            {/* Platform Admin for Admin users */}
            {user?.isPlatformAdmin && (
              <nav className="space-y-0.5 pt-2 border-t border-border/40">
                {!collapsed && (
                  <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-amber-500/90 font-semibold flex items-center gap-1.5 select-none">
                    <Shield size={11} />
                    <span>Platform Admin</span>
                  </div>
                )}
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
        {/* MODE 2: PROJECT MODE (Viewing a project workspace)        */}
        {/* ========================================================= */}
        {isProjectMode && (
          <div className="space-y-4">
            {/* Back to All Projects */}
            <div className="pb-1 border-b border-border/40">
              <Link
                href="/dashboard/projects"
                title={collapsed ? "Back to All Projects" : undefined}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-foreground-muted hover:text-foreground hover:bg-surface-elevated rounded-xl transition-colors font-medium group"
              >
                <ArrowLeft size={14} className="shrink-0 group-hover:-translate-x-0.5 transition-transform" />
                {!collapsed && <span>All Projects</span>}
              </Link>
            </div>

            {/* Selected Project Header */}
            {!collapsed ? (
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
            ) : (
              <div className="flex justify-center p-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    activeProject?.status === "RUNNING" ? "bg-emerald-400" : "bg-zinc-500"
                  }`}
                  title={activeProject?.name}
                />
              </div>
            )}

            {/* Project Workspace Items (Databases removed; selected in project overview) */}
            <nav className="space-y-0.5">
              {!collapsed && (
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-foreground-muted font-semibold select-none">
                  Project Workspace
                </div>
              )}
              {/* 1. Project Overview */}
              <NavItem
                href={`/dashboard/projects/${activeProjectId}`}
                icon={Activity}
                label="Project Overview"
                active={pathname === `/dashboard/projects/${activeProjectId}`}
              />
              {/* 2. Team & Access */}
              <NavItem
                href={`/dashboard/projects/${activeProjectId}/team`}
                icon={Users}
                label="Team & Access"
                active={pathname.startsWith(`/dashboard/projects/${activeProjectId}/team`)}
              />
              {/* 3. Resource Quotas */}
              <NavItem
                href={`/dashboard/projects/${activeProjectId}/usage`}
                icon={Gauge}
                label="Resource Quotas"
                active={pathname.startsWith(`/dashboard/projects/${activeProjectId}/usage`)}
              />
              {/* 4. Project Settings */}
              <NavItem
                href={`/dashboard/projects/${activeProjectId}/settings`}
                icon={Settings}
                label="Project Settings"
                active={pathname.startsWith(`/dashboard/projects/${activeProjectId}/settings`)}
              />
            </nav>

            {/* Host VM Specs mini-card */}
            {!collapsed && activeProject && (
              <div className="pt-2">
                <div className="p-3 rounded-xl bg-surface/60 border border-border/70 text-[10px] font-mono text-foreground-muted space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between font-semibold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Dedicated VM</span>
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-surface-elevated border border-border/50 text-[9px]">
                      KVM
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-foreground-muted/90 pt-1 border-t border-border/40">
                    <span>{activeProject.cpuCores || 2} vCPU · {Math.round((activeProject.ramMb || 4096) / 1024)}GB</span>
                    <span>{Math.round((activeProject.storageMb || 20480) / 1024)}GB SSD</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE 3: DATABASE MODE (Consolidated from Screenshot 2)   */}
        {/* ========================================================= */}
        {isDatabaseMode && (
          <div className="space-y-4">
            {/* Back to Project */}
            <div className="pb-1 border-b border-border/40">
              <Link
                href={`/dashboard/projects/${activeProjectId}`}
                title={collapsed ? "Back to Project" : undefined}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-foreground-muted hover:text-foreground hover:bg-surface-elevated rounded-xl transition-colors font-medium group"
              >
                <ArrowLeft size={14} className="shrink-0 group-hover:-translate-x-0.5 transition-transform" />
                {!collapsed && (
                  <span className="truncate">
                    {activeProject?.name ? `Back to ${activeProject.name}` : "Back to Project"}
                  </span>
                )}
              </Link>
            </div>

            {/* Active Database Badge Header */}
            {!collapsed ? (
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
            ) : (
              <div className="flex justify-center p-1.5" title={activeDatabase?.name || "Database"}>
                <Database size={16} className="text-primary-light" />
              </div>
            )}

            {/* Horizontal Tabs consolidated into Sidebar Navigation */}
            <nav className="space-y-0.5">
              {!collapsed && (
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-foreground-muted font-semibold select-none">
                  Database Console
                </div>
              )}
              {/* 1. Overview */}
              <NavItem
                href={`/dashboard/projects/${activeProjectId}/databases/${activeDatabaseId}?tab=Overview`}
                icon={Activity}
                label="Overview"
                active={currentTab === "Overview"}
              />
              {/* 2. Data Explorer */}
              <NavItem
                href={`/dashboard/projects/${activeProjectId}/databases/${activeDatabaseId}?tab=Data+Explorer`}
                icon={Layers}
                label="Data Explorer"
                active={currentTab === "Data Explorer"}
              />
              {/* 3. Connection */}
              <NavItem
                href={`/dashboard/projects/${activeProjectId}/databases/${activeDatabaseId}?tab=Connection`}
                icon={Terminal}
                label="Connection"
                active={currentTab === "Connection"}
              />
              {/* 4. Metrics */}
              <NavItem
                href={`/dashboard/projects/${activeProjectId}/databases/${activeDatabaseId}?tab=Metrics`}
                icon={Radio}
                label="Metrics"
                active={currentTab === "Metrics"}
              />
              {/* 5. Logs */}
              <NavItem
                href={`/dashboard/projects/${activeProjectId}/databases/${activeDatabaseId}?tab=Logs`}
                icon={FileText}
                label="Logs"
                active={currentTab === "Logs"}
              />
              {/* 6. Events */}
              <NavItem
                href={`/dashboard/projects/${activeProjectId}/databases/${activeDatabaseId}?tab=Events`}
                icon={History}
                label="Events"
                active={currentTab === "Events"}
              />
              {/* 7. Settings */}
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

      {/* SIDEBAR FOOTER (Help & Support, Collapse Toggle) */}
      <div className="p-2.5 border-t border-border/40 bg-sidebar shrink-0 flex items-center justify-between">
        {!collapsed ? (
          <>
            <Link
              href="/support"
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-foreground-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors font-medium"
            >
              <LifeBuoy size={15} />
              <span>Help & Support</span>
            </Link>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 text-foreground-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors"
              title="Collapse sidebar"
            >
              <PanelLeftClose size={15} />
            </button>
          </>
        ) : (
          <div className="w-full flex justify-center">
            <Link
              href="/support"
              className="p-1.5 text-foreground-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors"
              title="Help & Support"
            >
              <LifeBuoy size={16} />
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
