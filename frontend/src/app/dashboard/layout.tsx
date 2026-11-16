/**
 * @file src/app/dashboard/layout.tsx
 * @description Master layout wrapper for all authenticated `/dashboard/*` routes.
 * 
 * Features:
 * - 3-tier navigation hierarchy: Platform Mode, Project Mode, and Database Mode
 * - No default project auto-selection: platform routes show clean platform navigation
 * - Project routes activate project navigation (Overview, Team, Quotas, Settings)
 * - Database routes activate database console navigation (Overview, Data Explorer, Connection, Metrics, Logs, Events, Settings)
 * - Dynamic breadcrumbs resolving real Project & Database names
 * - Top-right user account dropdown
 */

"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AuthGuard } from "@/lib/auth/AuthGuard";
import { useAuth } from "@/lib/auth/AuthProvider";
import { listProjects } from "@/lib/api/projects";
import { listDatabases, getDatabase } from "@/lib/api/databases";
import { mapProject, mapDatabase } from "@/lib/api/mappers";
import { isDemoEnabled } from "@/lib/auth/demo/demoConfig";
import { getDemoSession } from "@/lib/auth/demo/demoSession";
import { DemoToolsModal } from "@/components/demo/DemoToolsModal";
import { CreateProjectModal } from "@/components/dashboard/CreateProjectModal";
import { Sidebar, Header, MobileDrawer } from "@/components/dashboard/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const segments = useMemo(() => pathname?.split("/").filter(Boolean) || [], [pathname]);

  // Extract project & database IDs from route segments if present
  const routeProjectId =
    segments[1] === "projects" && segments[2] && segments[2] !== "settings"
      ? segments[2]
      : null;
  const routeDatabaseId =
    segments[3] === "databases" && segments[4] ? segments[4] : null;

  const { user, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [demoToolsOpen, setDemoToolsOpen] = useState(false);
  const [hideBanner, setHideBanner] = useState(false);

  // Close mobile drawer on route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Read saved sidebar collapsed state
  useEffect(() => {
    try {
      const storedCollapsed = localStorage.getItem("dbaas_sidebar_collapsed");
      if (storedCollapsed === "true") setCollapsed(true);
    } catch {}
  }, []);

  // Fetch all projects for the organization/user
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res: any = await listProjects();
      return (res.data || res || []).map(mapProject);
    },
  });

  // Strict Context: NO auto-selection on platform pages!
  // Active project is ONLY present when the user is explicitly on a project route!
  const activeProjectId = routeProjectId;
  const activeProject = routeProjectId
    ? projects.find((p: any) => p.id === routeProjectId) || null
    : null;

  // Query databases for active project if on a project route
  const { data: activeDatabases = [] } = useQuery({
    queryKey: ["databases", activeProjectId],
    queryFn: async () => {
      if (!activeProjectId) return [];
      const r: any = await listDatabases(activeProjectId);
      const list = Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : [];
      return list.map(mapDatabase);
    },
    enabled: !!activeProjectId,
  });

  // Query active database if on a database route
  const { data: activeDatabaseData } = useQuery({
    queryKey: ["database", activeProjectId, routeDatabaseId],
    queryFn: async () => {
      if (!activeProjectId || !routeDatabaseId) return null;
      const r: any = await getDatabase(activeProjectId, routeDatabaseId);
      return mapDatabase(r.data || r);
    },
    enabled: !!activeProjectId && !!routeDatabaseId,
  });

  const activeDatabase =
    activeDatabaseData ||
    (routeDatabaseId
      ? activeDatabases.find((d: any) => d.id === routeDatabaseId) || null
      : null);

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("dbaas_sidebar_collapsed", String(next));
    } catch {}
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleSelectProject = (projId: string) => {
    router.push(`/dashboard/projects/${projId}`);
  };

  // Build breadcrumbs resolving real Project Name and Database Name
  const getBreadcrumbs = () => {
    const crumbs = [{ label: "Console", href: "/dashboard/projects" }];

    if (segments[1] === "projects") {
      crumbs.push({ label: "Projects", href: "/dashboard/projects" });
      if (routeProjectId) {
        const projName =
          activeProject?.name || routeProjectId;
        crumbs.push({ label: projName, href: `/dashboard/projects/${routeProjectId}` });

        if (segments[3] === "databases") {
          crumbs.push({
            label: "Databases",
            href: `/dashboard/projects/${routeProjectId}`,
          });
          if (routeDatabaseId) {
            const dbName =
              activeDatabase?.name || routeDatabaseId;
            crumbs.push({
              label: dbName,
              href: `/dashboard/projects/${routeProjectId}/databases/${routeDatabaseId}`,
            });
          }
        } else if (segments[3]) {
          crumbs.push({
            label: segments[3].charAt(0).toUpperCase() + segments[3].slice(1),
            href: `/dashboard/projects/${routeProjectId}/${segments[3]}`,
          });
        }
      }
    } else if (segments[1] === "invitations") {
      crumbs.push({ label: "Invitations", href: "/dashboard/invitations" });
    } else if (segments[1] === "subscription") {
      crumbs.push({ label: "Subscription & Billing", href: "/dashboard/subscription" });
    } else if (segments[1] === "account") {
      crumbs.push({ label: "Account Settings", href: "/dashboard/account" });
    } else if (segments[1] === "faq") {
      crumbs.push({ label: "FAQ", href: "/dashboard/faq" });
    } else if (segments[1] === "admin") {
      crumbs.push({ label: "Platform Admin", href: "/dashboard/admin" });
      if (segments[2]) {
        crumbs.push({
          label: segments[2].charAt(0).toUpperCase() + segments[2].slice(1),
          href: `/dashboard/admin/${segments[2]}`,
        });
      }
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background flex text-foreground text-sm">
        {/* DESKTOP PERSISTENT SIDEBAR */}
        <Suspense fallback={<aside className="w-[260px] border-r border-border bg-sidebar hidden md:flex shrink-0 h-screen" />}>
          <Sidebar
            collapsed={collapsed}
            onToggleCollapse={toggleSidebar}
            projects={projects}
            activeProject={activeProject}
            activeProjectId={activeProjectId}
            activeDatabaseId={routeDatabaseId}
            activeDatabase={activeDatabase}
            user={user}
            onSelectProject={handleSelectProject}
            onCreateProject={() => setCreateProjectModalOpen(true)}
          />
        </Suspense>

        {/* MOBILE DRAWER */}
        <Suspense fallback={null}>
          <MobileDrawer
            isOpen={mobileOpen}
            onClose={() => setMobileOpen(false)}
            projects={projects}
            activeProject={activeProject}
            activeProjectId={activeProjectId}
            activeDatabaseId={routeDatabaseId}
            activeDatabase={activeDatabase}
            user={user}
            onSelectProject={handleSelectProject}
            onCreateProject={() => setCreateProjectModalOpen(true)}
          />
        </Suspense>

        {/* MAIN BODY VIEWPORT */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* APPLICATION HEADER */}
          <Header
            breadcrumbs={breadcrumbs}
            activeProject={activeProject}
            user={user}
            onLogout={handleLogout}
            mobileOpen={mobileOpen}
            onToggleMobile={() => setMobileOpen(!mobileOpen)}
            onOpenDemoTools={() => setDemoToolsOpen(true)}
          />

          {/* CONTENT VIEWPORT */}
          <main className="p-6 sm:p-7 lg:p-8 max-w-[1440px] w-full mx-auto flex-1">
            {/* Demo Mode Banner */}
            {isDemoEnabled() && getDemoSession() && !hideBanner && (
              <div className="bg-warning/10 border border-warning/30 rounded-xl px-4 py-2.5 mb-6 flex items-center justify-between text-xs shadow-xs">
                <span className="text-warning flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse shrink-0" />
                  <span>
                    You are previewing with browser-isolated mock data. No cloud resources or billing charges are active.
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setHideBanner(true)}
                  className="text-warning/70 hover:text-warning text-base font-bold ml-4 leading-none"
                  aria-label="Dismiss banner"
                >
                  &times;
                </button>
              </div>
            )}

            {children}

            {/* Modals */}
            <DemoToolsModal
              isOpen={demoToolsOpen}
              onClose={() => setDemoToolsOpen(false)}
            />
            <CreateProjectModal
              isOpen={createProjectModalOpen}
              onClose={() => setCreateProjectModalOpen(false)}
            />
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
