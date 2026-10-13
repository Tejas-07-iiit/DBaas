
/**
 * @file src/app/dashboard/layout.tsx
 * @description Master layout wrapper for all authenticated `/dashboard/*` routes.
 * 
 * Features:
 * - AuthGuard protection (redirects unauthenticated users to /login)
 * - Collapsible, state-persisted sidebar navigation with 3 tiers:
 *   1. Global routes (Overview, Projects, Subscription, Account)
 *   2. Project-scoped routes (Databases, Team, Settings) when viewing a project
 *   3. Platform Admin routes (Users, Projects, Databases, Health) when user is admin
 * - User profile dropdown with logout and Demo Tools modal trigger
 * - Demo mode persistent banner and status badge
 */

"use client";

import { AuthGuard } from "@/lib/auth/AuthGuard";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { isDemoEnabled } from "@/lib/auth/demo/demoConfig";
import { getDemoSession } from "@/lib/auth/demo/demoSession";
// DEMO MODE
import { DemoToolsModal } from "@/components/demo/DemoToolsModal";
import { useAuth } from "@/lib/auth/AuthProvider";
import { 
  Shield, Home, FolderKanban, CreditCard, User, 
  Database, Users, Activity, Settings, 
  PanelLeftClose, PanelLeftOpen 
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const projectId = pathname?.split('/')[3];
  const { user, logout } = useAuth();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // DEMO MODE
  const [demoToolsOpen, setDemoToolsOpen] = useState(false);
  const [hideBanner, setHideBanner] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('dbaas_sidebar_collapsed');
      if (stored === 'true') setCollapsed(true);
    } catch {}
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
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

  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  const initials = firstName.substring(0, 2).toUpperCase();

  const NavItem = ({ href, icon: Icon, label, exact = false }: any) => {
    const active = exact ? pathname === href : pathname?.startsWith(href);
    return (
      <Link href={href} className={`flex items-center gap-3 px-3 py-2 rounded transition-colors group relative ${active ? 'bg-surface-2 text-text' : 'text-muted hover:text-text hover:bg-surface-2'}`}>
        {active && <div className="absolute left-0 top-2 bottom-2 w-1 bg-accent rounded-r-full" />}
        <Icon size={18} className="shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    );
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-bg flex text-text text-sm">
        {/* SIDEBAR */}
        <aside className={`${collapsed ? 'w-16' : 'w-64'} border-r border-border/50 bg-surface/30 p-3 flex flex-col gap-6 hidden md:flex transition-all duration-300 relative`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-2 mt-2`}>
            {!collapsed && <div className="font-bold text-xl font-mono text-accent">DBaaS</div>}
            <button onClick={toggleSidebar} className="text-muted hover:text-text">
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>
          
          <nav className="flex flex-col gap-1">
            {!collapsed && <div className="text-xs font-mono text-muted uppercase mb-2 px-2 mt-2">Global</div>}
            <NavItem href="/dashboard" icon={Home} label="Overview" exact />
            <NavItem href="/dashboard/projects" icon={FolderKanban} label="Projects" />
            <NavItem href="/dashboard/subscription" icon={CreditCard} label="Subscription" />
            <NavItem href="/dashboard/account" icon={User} label="Account" />
          </nav>
          
          {projectId && projectId !== 'settings' && (
            <nav className="flex flex-col gap-1">
              {!collapsed && <div className="text-xs font-mono text-muted uppercase mb-2 px-2 mt-4">Project</div>}
              <NavItem href={`/dashboard/projects/${projectId}`} icon={Activity} label="Overview" exact />
              <NavItem href={`/dashboard/projects/${projectId}/databases`} icon={Database} label="Databases" />
              <NavItem href={`/dashboard/projects/${projectId}/team`} icon={Users} label="Team" />
              <NavItem href={`/dashboard/projects/${projectId}/settings`} icon={Settings} label="Settings" />
              {!collapsed && <Link href="/dashboard/projects" className="text-xs text-muted hover:text-text px-3 mt-4 flex items-center gap-2">&larr; All projects</Link>}
            </nav>
          )}
        {user?.isPlatformAdmin && (
            <nav className="flex flex-col gap-1">
              {!collapsed && <div className="text-xs font-mono text-amber-500 uppercase mb-2 px-2 mt-4 flex items-center gap-2"><Shield size={14}/> Platform Admin</div>}
              <NavItem href="/dashboard/admin" icon={Shield} label="Overview" exact />
              <NavItem href="/dashboard/admin/users" icon={Users} label="Users" />
              <NavItem href="/dashboard/admin/projects" icon={FolderKanban} label="Projects" />
              <NavItem href="/dashboard/admin/databases" icon={Database} label="Databases" />
              <NavItem href="/dashboard/admin/health" icon={Activity} label="System health" />
            </nav>
          )}
        </aside>
        {/* MAIN */}
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border/50 flex items-center px-6 justify-between bg-surface/30">
            <div className="font-mono text-muted text-sm truncate">{projectId ? `Project / ${projectId}` : 'Dashboard'}</div>
            
            <div className="flex items-center gap-4 text-muted relative" ref={menuRef}>
              {isDemoEnabled() && getDemoSession() && (
                <div className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-bold tracking-widest uppercase rounded cursor-help" title="Not a real account. No backend is connected.">
                  Demo Mode
                </div>
              )}
              
              <button 
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                className="flex items-center gap-2 hover:text-text transition-colors"
              >
                <div className="w-8 h-8 rounded-full border border-accent/50 bg-surface flex items-center justify-center text-xs font-bold text-text">
                  {initials}
                </div>
                <span className="hidden sm:inline text-sm font-medium">{firstName}</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-10 mt-2 w-56 bg-surface border border-border/50 rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-border/50 mb-2">
                    <div className="font-bold text-text truncate">{user?.name}</div>
                    <div className="text-xs text-muted truncate">{user?.email}</div>
                  </div>
                  {/* DEMO MODE */}
                  {isDemoEnabled() && getDemoSession() && (
                    <button onClick={() => { setMenuOpen(false); setDemoToolsOpen(true); }} className="w-full text-left px-4 py-2 text-sm text-amber-500 hover:bg-surface-2 transition-colors">Demo tools</button>
                  )}
                  <Link href="/dashboard/account" className="block px-4 py-2 text-sm hover:bg-surface-2 transition-colors" onClick={() => setMenuOpen(false)}>Account settings</Link>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-surface-2 transition-colors">Log out</button>
                </div>
              )}
            </div>
          </header>
          
          <div className="p-6 lg:p-8 max-w-7xl w-full mx-auto flex-1">
            {/* DEMO MODE */}
            {isDemoEnabled() && getDemoSession() && !hideBanner && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-6 flex items-center justify-between">
                <span className="text-amber-500 text-sm">You are viewing demo data stored in your browser. Nothing is sent anywhere.</span>
                <button onClick={() => setHideBanner(true)} className="text-amber-500/70 hover:text-amber-500 text-sm">&times;</button>
              </div>
            )}
            {children}
            <DemoToolsModal isOpen={demoToolsOpen} onClose={() => setDemoToolsOpen(false)} />
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
