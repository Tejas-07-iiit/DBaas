/**
 * @file src/components/dashboard/navigation/ProjectSelector.tsx
 * @description Project workspace switcher component for the M-DBaaS console.
 * Features:
 * - Current workspace name, status dot, and icon
 * - Search filter for projects
 * - Quick 'Create New Project' and 'View All Projects' actions
 * - Click-outside and Escape key dismissal
 * - Collapsed sidebar support with flyout popover
 */

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { FolderKanban, ChevronsUpDown, Check, Plus, Search, ChevronRight } from "lucide-react";

export interface ProjectSelectorProps {
  projects: any[];
  activeProject: any | null;
  activeProjectId: string | null;
  collapsed: boolean;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  onNavigate?: () => void;
}

export function ProjectSelector({
  projects,
  activeProject,
  activeProjectId,
  collapsed,
  onSelectProject,
  onCreateProject,
  onNavigate,
}: ProjectSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click or escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("mousedown", handleClickOutside);
      // Autofocus search on open
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const filteredProjects = projects.filter((p: any) =>
    (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.id || "").toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string | undefined) => {
    switch (status?.toUpperCase()) {
      case "RUNNING":
        return "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]";
      case "PROVISIONING":
        return "bg-amber-400 animate-pulse";
      case "STOPPED":
        return "bg-zinc-500";
      default:
        return "bg-emerald-400";
    }
  };

  const projectInitials = activeProject?.name
    ? activeProject.name.slice(0, 2).toUpperCase()
    : "WS";

  return (
    <div className="relative mb-3 shrink-0" ref={dropdownRef}>
      {!collapsed ? (
        <div>
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all text-left group shadow-xs ${
              open
                ? "bg-surface-elevated border-primary-light/60 ring-1 ring-primary-light/30"
                : "bg-surface/70 hover:bg-surface-elevated border-border/80 hover:border-border-bright"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-primary-subtle border border-primary-light/25 flex items-center justify-center font-bold text-xs text-primary-light shrink-0">
                {projectInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-xs text-foreground truncate group-hover:text-primary-light transition-colors leading-tight">
                  {activeProject?.name || "Select Project"}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-foreground-muted font-mono mt-0.5 truncate">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusColor(
                      activeProject?.status
                    )}`}
                  />
                  <span className="truncate">
                    {activeProject?.status || "Dedicated VM"}
                  </span>
                </div>
              </div>
            </div>
            <ChevronsUpDown
              size={14}
              className="text-foreground-muted group-hover:text-foreground shrink-0 ml-1.5 transition-colors"
            />
          </button>

          {/* Expanded Dropdown Menu */}
          {open && (
            <div className="absolute left-0 top-full mt-1.5 w-full min-w-[270px] bg-surface border border-border rounded-xl shadow-2xl p-2 z-50 backdrop-blur-xl">
              {/* Search projects */}
              <div className="relative mb-2">
                <Search
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground-muted"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Filter projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-surface-elevated border border-border/60 rounded-lg pl-7 pr-3 py-1.5 text-xs text-foreground placeholder:text-foreground-muted outline-none focus:border-primary-light font-mono"
                />
              </div>

              {/* Projects List */}
              <div className="max-h-52 overflow-y-auto space-y-0.5 mb-2 pr-0.5">
                {filteredProjects.map((p: any) => {
                  const isSelected = p.id === activeProjectId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        setSearch("");
                        onSelectProject(p.id);
                        if (onNavigate) onNavigate();
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                        isSelected
                          ? "bg-primary-subtle text-primary-light font-semibold border border-primary-light/20"
                          : "text-foreground hover:bg-surface-elevated"
                      }`}
                    >
                      <div className="truncate min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusColor(
                              p.status
                            )}`}
                          />
                          <span className="truncate font-medium">{p.name}</span>
                        </div>
                        <div
                          className="text-[10px] text-foreground-muted font-mono truncate pl-3"
                          title={p.id}
                        >
                          {p.id}
                        </div>
                      </div>
                      {isSelected && (
                        <Check
                          size={14}
                          className="text-primary-light shrink-0"
                        />
                      )}
                    </button>
                  );
                })}
                {filteredProjects.length === 0 && (
                  <div className="text-xs text-foreground-muted text-center py-4">
                    No projects found
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-2 border-t border-border/40 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onCreateProject();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-primary-light hover:bg-surface-elevated rounded-lg font-semibold transition-colors"
                >
                  <Plus size={13} />
                  <span>Create New Project</span>
                </button>
                <Link
                  href="/dashboard/projects"
                  onClick={() => {
                    setOpen(false);
                    if (onNavigate) onNavigate();
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-foreground-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors"
                >
                  <span>All Projects ({projects.length})</span>
                  <ChevronRight size={13} />
                </Link>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Collapsed Sidebar Mode */
        <div>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="w-full flex justify-center p-2 rounded-xl bg-surface-elevated hover:bg-surface text-primary-light border border-border/60 transition-colors shadow-xs"
            title={`Active Project: ${activeProject?.name || "Select Project"}`}
          >
            <FolderKanban size={16} />
          </button>

          {/* Collapsed Flyout Dropdown */}
          {open && (
            <div className="absolute left-full top-0 ml-2 w-64 bg-surface border border-border rounded-xl shadow-2xl p-2.5 z-50 backdrop-blur-xl">
              <div className="px-2 py-1.5 border-b border-border/40 mb-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-foreground-muted font-semibold">
                  Switch Workspace
                </div>
                <div className="text-xs font-semibold text-foreground truncate mt-0.5">
                  {activeProject?.name || "No Project Selected"}
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-2">
                <Search
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground-muted"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Filter projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-surface-elevated border border-border/60 rounded-lg pl-7 pr-3 py-1.5 text-xs text-foreground placeholder:text-foreground-muted outline-none focus:border-primary-light font-mono"
                />
              </div>

              {/* List */}
              <div className="max-h-48 overflow-y-auto space-y-0.5 mb-2 pr-0.5">
                {filteredProjects.map((p: any) => {
                  const isSelected = p.id === activeProjectId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        onSelectProject(p.id);
                        if (onNavigate) onNavigate();
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors text-left ${
                        isSelected
                          ? "bg-primary-subtle text-primary-light font-semibold"
                          : "text-foreground hover:bg-surface-elevated"
                      }`}
                    >
                      <span className="truncate">{p.name}</span>
                      {isSelected && (
                        <Check size={13} className="text-primary-light shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-border/40 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onCreateProject();
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-primary-light hover:bg-surface-elevated rounded-lg font-semibold transition-colors"
                >
                  <Plus size={13} />
                  <span>Create Project</span>
                </button>
                <Link
                  href="/dashboard/projects"
                  onClick={() => {
                    setOpen(false);
                    if (onNavigate) onNavigate();
                  }}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-foreground-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors"
                >
                  <span>All Projects</span>
                  <ChevronRight size={13} />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
