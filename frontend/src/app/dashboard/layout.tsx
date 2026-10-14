/**
 * @file src/app/dashboard/layout.tsx
 * @description Master layout wrapper for all authenticated `/dashboard/*` routes.
 * 
 * Features:
 * - Persistent Project Switcher with 1-click project selection & creation
 * - Honest, uncluttered navigation showing ONLY real available features:
 *   1. Active Project Services (Databases, Overview, Team, Resource Usage, Settings)
 *   2. Platform Organization (Overview, All Projects, Subscription, Account)
 *   3. Platform Admin (when user has platform admin privileges)
 * - Intelligent breadcrumbs resolving human-readable Project & Database names
 * - Pinned user profile footer with quick actions
 */

"use client";

import { AuthGuard } from "@/lib/auth/AuthGuard";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listProjects } from "@/lib/api/projects";
import { listDatabases } from "@/lib/api/databases";
import { mapProject, mapDatabase } from "@/lib/api/mappers";
import { isDemoEnabled } from "@/lib/auth/demo/demoConfig";
import { getDemoSession } from "@/lib/auth/demo/demoSession";
import { DemoToolsModal } from "@/components/demo/DemoToolsModal";
import { CreateProjectModal } from "@/components/dashboard/CreateProjectModal";
import { useAuth } from "@/lib/auth/AuthProvider";
import { 
  Shield, Home, FolderKanban, CreditCard, User, 
  Database, Users, Activity, Settings, 
  PanelLeftClose, PanelLeftOpen, ChevronRight, LogOut,
  ChevronsUpDown, Check, Plus, Search, Radio
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const segments = pathname?.split('/').filter(Boolean) || [];
  
  // Extract project & database IDs from route segments if present
  const routeProjectId = segments[1] === 'projects' && segments[2] && segments[2] !== 'settings' 
    ? segments[2] 
    : null;
  const routeDatabaseId = segments[3] === 'databases' && segments[4] 
    ? segments[4] 
    : null;

  const { user, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [demoToolsOpen, setDemoToolsOpen] = useState(false);
  const [hideBanner, setHideBanner] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const projectDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch all projects for the organization/user
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res: any = await listProjects();
      return (res.data || res || []).map(mapProject);
    }
  });

  // Determine active project ID (URL route has highest priority, then localStorage, then first project)
  const [storedProjectId, setStoredProjectId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('dbaas_sidebar_collapsed');
      if (stored === 'true') setCollapsed(true);
      const lastProj = localStorage.getItem('dbaas_last_project');
      if (lastProj) setStoredProjectId(lastProj);
    } catch {}
  }, []);

  // Update localStorage when route changes to a valid project
  useEffect(() => {
    if (routeProjectId) {
      try {
        localStorage.setItem('dbaas_last_project', routeProjectId);
        setStoredProjectId(routeProjectId);
      } catch {}
    }
  }, [routeProjectId]);

  const activeProjectId = useMemo(() => {
    if (routeProjectId) return routeProjectId;
    if (storedProjectId && projects.some((p: any) => p.id === storedProjectId)) {
      return storedProjectId;
    }
    return projects[0]?.id || null;
  }, [routeProjectId, storedProjectId, projects]);

  const activeProject = useMemo(() => {
    return projects.find((p: any) => p.id === activeProjectId) || projects[0] || null;
  }, [projects, activeProjectId]);

  // Query databases for active project so cluster count badge is accurate
  const { data: activeDatabases = [] } = useQuery({
    queryKey: ["databases", activeProjectId],
    queryFn: async () => {
      if (!activeProjectId) return [];
      const r: any = await listDatabases(activeProjectId);
      const list = Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : [];
      return list.map(mapDatabase);
    },
    enabled: !!activeProjectId
  });

  // Close menus on outside click or escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { 
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setProjectDropdownOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target as Node)) {
        setProjectDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem('dbaas_sidebar_collapsed', String(next)); } catch {}
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleSelectProject = (projId: string) => {
    setProjectDropdownOpen(false);
    try {
      localStorage.setItem('dbaas_last_project', projId);
      setStoredProjectId(projId);
    } catch {}
    router.push(`/dashboard/projects/${projId}`);
  };

  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  const initials = firstName.substring(0, 2).toUpperCase();

  const NavItem = ({ href, icon: Icon, label, exact = false, badge }: any) => {
    const active = exact ? pathname === href : pathname?.startsWith(href);
    return (
      <Link 
        href={href} 
        title={collapsed ? label : undefined}
        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors group relative ${
          active 
            ? 'bg-surface-2 text-text font-semibold border border-border/60 shadow-sm' 
            : 'text-muted hover:text-text hover:bg-surface-2/60'
        }`}
      >
        {active && (
          <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-accent rounded-r-full" />
        )}
        <Icon size={16} className={`shrink-0 ${active ? 'text-accent' : 'text-muted group-hover:text-text'}`} />
        {!collapsed && (
          <span className="truncate flex-1">{label}</span>
        )}
        {!collapsed && badge && (
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-2 border border-border/50 text-muted font-mono">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  // Build breadcrumbs resolving real Project Name and Database Name
  const getBreadcrumbs = () => {
    const crumbs = [
      { label: 'Console', href: '/dashboard' }
    ];

    if (segments[1] === 'projects') {
      crumbs.push({ label: 'Projects', href: '/dashboard/projects' });
      if (routeProjectId) {
        const projName = projects.find((p: any) => p.id === routeProjectId)?.name || routeProjectId;
        crumbs.push({ label: projName, href: `/dashboard/projects/${routeProjectId}` });

        if (segments[3] === 'databases') {
          crumbs.push({ label: 'Databases', href: `/dashboard/projects/${routeProjectId}/databases` });
          if (routeDatabaseId) {
            const dbName = activeDatabases.find((d: any) => d.id === routeDatabaseId)?.name || routeDatabaseId;
            crumbs.push({ label: dbName, href: `/dashboard/projects/${routeProjectId}/databases/${routeDatabaseId}` });
          }
        } else if (segments[3]) {
          crumbs.push({ 
            label: segments[3].charAt(0).toUpperCase() + segments[3].slice(1), 
            href: `/dashboard/projects/${routeProjectId}/${segments[3]}` 
          });
        }
      }
    } else if (segments[1] === 'subscription') {
      crumbs.push({ label: 'Subscription & Billing', href: '/dashboard/subscription' });
    } else if (segments[1] === 'account') {
      crumbs.push({ label: 'Account Settings', href: '/dashboard/account' });
    } else if (segments[1] === 'admin') {
      crumbs.push({ label: 'Platform Admin', href: '/dashboard/admin' });
      if (segments[2]) {
        crumbs.push({ label: segments[2].charAt(0).toUpperCase() + segments[2].slice(1), href: `/dashboard/admin/${segments[2]}` });
      }
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  const filteredProjects = projects.filter((p: any) => 
    p.name.toLowerCase().includes(projectSearch.toLowerCase()) || 
    (p.id || "").toLowerCase().includes(projectSearch.toLowerCase())
  );

  return (
    <AuthGuard>
      <div className="min-h-screen bg-bg flex text-text text-sm">
        {/* SIDEBAR */}
        <aside 
          className={`${
            collapsed ? 'w-16' : 'w-72'
          } border-r border-border/40 bg-surface/60 backdrop-blur-md flex flex-col justify-between hidden md:flex transition-all duration-200 select-none shrink-0 z-20 h-screen sticky top-0`}
        >
          {/* Top Section: Brand + Project Switcher + Real Available Menus */}
          <div className="flex flex-col min-h-0 flex-1 overflow-y-auto hide-scrollbar p-3">
            {/* Brand Header */}
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-1 py-1 mb-3 shrink-0`}>
              {!collapsed ? (
                <Link href="/dashboard" className="flex items-center gap-2.5 group">
                  <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center text-accent group-hover:border-accent transition-colors">
                    <Database size={15} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-base tracking-tight text-text">DBaaS</span>
                    <span className="text-[10px] px-1 py-0.2 rounded font-mono bg-surface-2 border border-border/60 text-muted">Cloud</span>
                  </div>
                </Link>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
                  <Database size={16} />
                </div>
              )}
              <button 
                onClick={toggleSidebar} 
                className="text-muted hover:text-text p-1 rounded-md hover:bg-surface-2 transition-colors"
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              </button>
            </div>

            {/* PROJECT SWITCHER DROPDOWN */}
            <div className="relative mb-3 shrink-0" ref={projectDropdownRef}>
              {!collapsed ? (
                <div>
                  <button
                    onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-surface-2/60 hover:bg-surface-2 border border-border/60 hover:border-accent/40 transition-all text-left group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 group-hover:border-accent transition-colors">
                        <FolderKanban size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-semibold text-muted uppercase tracking-wider truncate">
                          Project Workspace
                        </div>
                        <div className="font-bold text-xs text-text truncate group-hover:text-accent transition-colors">
                          {activeProject?.name || "Select Project"}
                        </div>
                      </div>
                    </div>
                    <ChevronsUpDown size={14} className="text-muted group-hover:text-text shrink-0 ml-1" />
                  </button>

                  {/* Dropdown Menu */}
                  {projectDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-full min-w-[270px] bg-surface border border-border/80 rounded-xl shadow-2xl p-2 z-50">
                      {/* Search */}
                      <div className="relative mb-2">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                          type="text"
                          placeholder="Filter projects..."
                          value={projectSearch}
                          onChange={(e) => setProjectSearch(e.target.value)}
                          className="w-full bg-surface-2 border border-border/60 rounded-lg pl-7 pr-3 py-1.5 text-xs text-text placeholder:text-muted outline-none focus:border-accent font-mono"
                        />
                      </div>

                      {/* Project List */}
                      <div className="max-h-44 overflow-y-auto space-y-0.5 mb-2 pr-0.5">
                        {filteredProjects.map((p: any) => {
                          const isSelected = p.id === activeProjectId;
                          return (
                            <button
                              key={p.id}
                              onClick={() => handleSelectProject(p.id)}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                                isSelected 
                                  ? 'bg-accent/10 text-accent font-semibold' 
                                  : 'text-text hover:bg-surface-2'
                              }`}
                            >
                              <div className="truncate min-w-0 pr-2">
                                <div className="truncate font-medium">{p.name}</div>
                                <div className="text-[10px] text-muted font-mono truncate" title={p.id}>{p.id}</div>
                              </div>
                              {isSelected && <Check size={14} className="text-accent shrink-0" />}
                            </button>
                          );
                        })}
                        {filteredProjects.length === 0 && (
                          <div className="text-xs text-muted text-center py-3">No projects found</div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="pt-2 border-t border-border/40 space-y-1">
                        <button
                          onClick={() => {
                            setProjectDropdownOpen(false);
                            setCreateProjectModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-accent hover:bg-surface-2 rounded-lg font-semibold transition-colors"
                        >
                          <Plus size={13} />
                          <span>Create New Project</span>
                        </button>
                        <Link
                          href="/dashboard/projects"
                          onClick={() => setProjectDropdownOpen(false)}
                          className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-muted hover:text-text hover:bg-surface-2 rounded-lg transition-colors"
                        >
                          <span>All Projects ({projects.length})</span>
                          <ChevronRight size={13} />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                  className="w-full flex justify-center p-2 rounded-lg bg-surface-2/60 hover:bg-surface-2 text-accent border border-border/60 transition-colors"
                  title={`Project: ${activeProject?.name || "Select Project"}`}
                >
                  <FolderKanban size={16} />
                </button>
              )}
            </div>

            {/* REAL, WORKING NAVIGATION MENUS */}
            <div className="space-y-4">
              {/* TIER 1: ACTIVE PROJECT WORKSPACE MENUS (ALWAYS AVAILABLE) */}
              {activeProjectId && (
                <nav className="space-y-0.5">
                  {!collapsed && (
                    <div className="flex items-center justify-between px-2 py-1">
                      <span className="text-[10px] font-semibold text-muted uppercase tracking-wider truncate">
                        Project Services
                      </span>
                      <Link 
                        href={`/dashboard/projects/${activeProjectId}`}
                        className="text-[10px] text-accent hover:underline"
                        title="View Project Overview"
                      >
                        Overview &rarr;
                      </Link>
                    </div>
                  )}
                  <NavItem 
                    href={`/dashboard/projects/${activeProjectId}/databases`} 
                    icon={Database} 
                    label="Databases" 
                    badge={activeDatabases.length > 0 ? String(activeDatabases.length) : undefined}
                  />
                  <NavItem 
                    href={`/dashboard/projects/${activeProjectId}`} 
                    icon={Activity} 
                    label="Project Overview" 
                    exact 
                  />
                  <NavItem 
                    href={`/dashboard/projects/${activeProjectId}/team`} 
                    icon={Users} 
                    label="Team & Access" 
                  />
                  <NavItem 
                    href={`/dashboard/projects/${activeProjectId}/usage`} 
                    icon={Radio} 
                    label="Resource Quotas" 
                  />
                  <NavItem 
                    href={`/dashboard/projects/${activeProjectId}/settings`} 
                    icon={Settings} 
                    label="Project Settings" 
                  />
                </nav>
              )}

              {/* TIER 2: PLATFORM (GLOBAL) */}
              <nav className="space-y-0.5 pt-2 border-t border-border/30">
                {!collapsed && (
                  <div className="text-[10px] font-semibold text-muted uppercase tracking-wider px-2 py-1">
                    Platform
                  </div>
                )}
                <NavItem href="/dashboard" icon={Home} label="Overview" exact />
                <NavItem href="/dashboard/projects" icon={FolderKanban} label="All Projects" exact />
                <NavItem href="/dashboard/subscription" icon={CreditCard} label="Billing & Plans" />
                <NavItem href="/dashboard/account" icon={User} label="Account Settings" />
              </nav>

              {/* TIER 3: PLATFORM ADMIN (FOR PLATFORM ADMINS) */}
              {user?.isPlatformAdmin && (
                <nav className="space-y-0.5 pt-2 border-t border-border/30">
                  {!collapsed && (
                    <div className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                      <Shield size={12} />
                      <span>Platform Admin</span>
                    </div>
                  )}
                  <NavItem href="/dashboard/admin" icon={Shield} label="Admin Overview" exact />
                  <NavItem href="/dashboard/admin/users" icon={Users} label="Users Registry" />
                  <NavItem href="/dashboard/admin/projects" icon={FolderKanban} label="Tenant Projects" />
                  <NavItem href="/dashboard/admin/databases" icon={Database} label="Cluster Fleet" />
                  <NavItem href="/dashboard/admin/health" icon={Activity} label="System Health" />
                </nav>
              )}
            </div>
          </div>

          {/* Bottom Pinned User Profile */}
          <div className="p-3 border-t border-border/30 bg-surface/30 shrink-0">
            {!collapsed ? (
              <div className="flex items-center justify-between p-1">
                <Link href="/dashboard/account" className="flex items-center gap-2.5 min-w-0 group">
                  <div className="w-8 h-8 rounded-lg bg-surface-2 border border-border/60 flex items-center justify-center font-bold text-xs text-text group-hover:border-accent transition-colors shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-text truncate group-hover:text-accent transition-colors">{user?.name || firstName}</div>
                    <div className="text-[10px] text-muted truncate">{user?.email}</div>
                  </div>
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="text-muted hover:text-red-400 p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
                  title="Sign out"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Link href="/dashboard/account" className="w-8 h-8 rounded-lg bg-surface-2 border border-border/60 flex items-center justify-center font-bold text-xs text-text hover:border-accent transition-colors" title={user?.name || "Account"}>
                  {initials}
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="text-muted hover:text-red-400 p-1 rounded-md hover:bg-surface-2 transition-colors"
                  title="Sign out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* MAIN BODY */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* TOP BAR */}
          <header className="h-14 border-b border-border/40 flex items-center px-6 justify-between bg-surface/30 backdrop-blur-md sticky top-0 z-10">
            {/* Breadcrumb Navigation with Real Project & Database Names */}
            <div className="flex items-center gap-1.5 text-xs font-mono overflow-x-auto hide-scrollbar">
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <div key={crumb.href + idx} className="flex items-center gap-1.5 whitespace-nowrap">
                    {idx > 0 && <ChevronRight size={13} className="text-muted/40 shrink-0" />}
                    {isLast ? (
                      <span className="font-semibold text-text max-w-xs truncate">{crumb.label}</span>
                    ) : (
                      <Link href={crumb.href} className="text-muted hover:text-text transition-colors max-w-xs truncate">
                        {crumb.label}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Right Tools / User Profile */}
            <div className="flex items-center gap-3 text-muted relative" ref={menuRef}>
              {isDemoEnabled() && getDemoSession() && (
                <button 
                  onClick={() => setDemoToolsOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[11px] font-semibold rounded-md hover:bg-amber-500/20 transition-colors"
                  title="Click to configure Demo Simulator"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>Demo Mode</span>
                </button>
              )}
              
              <button 
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-2 transition-colors text-text"
              >
                <div className="w-7 h-7 rounded-lg border border-accent/40 bg-surface flex items-center justify-center text-xs font-bold text-accent">
                  {initials}
                </div>
                <span className="hidden sm:inline text-xs font-medium">{firstName}</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-11 w-56 bg-surface border border-border/70 rounded-xl shadow-2xl py-1.5 z-50">
                  <div className="px-3.5 py-2.5 border-b border-border/40 mb-1">
                    <div className="font-semibold text-xs text-text truncate">{user?.name}</div>
                    <div className="text-[11px] text-muted truncate">{user?.email}</div>
                  </div>
                  {isDemoEnabled() && getDemoSession() && (
                    <button 
                      onClick={() => { setMenuOpen(false); setDemoToolsOpen(true); }} 
                      className="w-full text-left px-3.5 py-2 text-xs text-amber-500 hover:bg-surface-2 transition-colors flex items-center justify-between"
                    >
                      <span>Demo Simulator</span>
                      <span className="text-[10px] font-mono bg-amber-500/10 px-1 py-0.5 rounded">LOCAL</span>
                    </button>
                  )}
                  <Link 
                    href="/dashboard/account" 
                    className="block px-3.5 py-2 text-xs text-text hover:bg-surface-2 transition-colors" 
                    onClick={() => setMenuOpen(false)}
                  >
                    Account Settings
                  </Link>
                  <Link 
                    href="/dashboard/subscription" 
                    className="block px-3.5 py-2 text-xs text-text hover:bg-surface-2 transition-colors" 
                    onClick={() => setMenuOpen(false)}
                  >
                    Billing & Subscription
                  </Link>
                  <div className="h-px bg-border/30 my-1"></div>
                  <button 
                    onClick={handleLogout} 
                    className="w-full text-left px-3.5 py-2 text-xs text-red-400 hover:bg-surface-2 transition-colors flex items-center gap-2"
                  >
                    <LogOut size={13} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </header>
          
          {/* CONTENT VIEWPORT */}
          <div className="p-6 lg:p-8 max-w-7xl w-full mx-auto flex-1">
            {/* Demo Banner */}
            {isDemoEnabled() && getDemoSession() && !hideBanner && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2.5 mb-6 flex items-center justify-between text-xs">
                <span className="text-amber-500 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  You are previewing with browser-isolated mock data. No cloud resources or billing charges are active.
                </span>
                <button onClick={() => setHideBanner(true)} className="text-amber-500/70 hover:text-amber-500 text-base font-bold ml-4">
                  &times;
                </button>
              </div>
            )}
            {children}
            <DemoToolsModal isOpen={demoToolsOpen} onClose={() => setDemoToolsOpen(false)} />
            <CreateProjectModal 
              isOpen={createProjectModalOpen} 
              onClose={() => setCreateProjectModalOpen(false)} 
            />
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
