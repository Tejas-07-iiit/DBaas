/**
 * @file src/components/dashboard/navigation/AccountDropdown.tsx
 * @description Top-right user account menu dropdown.
 * 
 * Features:
 * - Avatar trigger with initials, status dot, display name, and chevron
 * - Polished floating panel aligned to the right edge below the avatar
 * - Identity header: Avatar, Full Name, Email
 * - Nav destinations: My Profile, Security & Password, Preferences, Help & Support, Sign Out
 * - Preserves Platform Admin and Demo Simulator access
 * - Click-outside and Escape key dismissal
 * - Keyboard navigation support
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  User, KeyRound, Sliders, HelpCircle, LogOut, 
  ChevronDown, Shield, Wrench, Mail 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMyPendingInvitations } from "@/lib/api/invitations";
import { isDemoEnabled } from "@/lib/auth/demo/demoConfig";
import { getDemoSession } from "@/lib/auth/demo/demoSession";

export interface AccountDropdownProps {
  user: any;
  onLogout: () => Promise<void> | void;
  onOpenDemoTools?: () => void;
}

export function AccountDropdown({
  user,
  onLogout,
  onOpenDemoTools,
}: AccountDropdownProps) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const fullName = user?.name || "Developer";
  const email = user?.email || "user@example.com";
  const firstName = fullName.split(" ")[0] || "User";
  const initials = (user?.name || firstName).substring(0, 2).toUpperCase();

  const { data: myPendingInv = [] } = useQuery({
    queryKey: ["my-pending-invitations"],
    queryFn: getMyPendingInvitations,
    enabled: !!user?.email,
    refetchInterval: 15000,
  });
  const pendingCount = Array.isArray(myPendingInv) ? myPendingInv.length : 0;

  const handleClose = useCallback(() => {
    setOpen(false);
    setFocusedIndex(-1);
  }, []);

  // Click outside and escape handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, handleClose]);

  // Keyboard navigation inside dropdown
  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    const items = menuRef.current?.querySelectorAll<HTMLElement>(
      '[role="menuitem"]'
    );
    if (!items || items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (focusedIndex + 1) % items.length;
      setFocusedIndex(nextIndex);
      items[nextIndex]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = (focusedIndex - 1 + items.length) % items.length;
      setFocusedIndex(prevIndex);
      items[prevIndex]?.focus();
    } else if (e.key === "Tab") {
      handleClose();
    }
  };

  const hasDemo = isDemoEnabled() && getDemoSession();

  return (
    <div className="relative shrink-0" ref={containerRef}>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        id="account-menu-trigger"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="User account menu"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 p-1.5 sm:px-2 sm:py-1.5 rounded-xl border transition-all text-left group ${
          open
            ? "bg-surface-elevated border-primary-light/50 ring-1 ring-primary-light/30"
            : "hover:bg-surface-elevated border-transparent hover:border-border/80"
        }`}
      >
        {/* User avatar with initials and status dot */}
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-primary-subtle border border-primary-light/30 flex items-center justify-center text-xs font-bold text-primary-light shadow-xs group-hover:border-primary-light transition-colors">
            {initials}
          </div>
          {pendingCount > 0 ? (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-surface absolute -top-0.5 -right-0.5 animate-pulse ring-2 ring-emerald-500/40" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-400 border-2 border-surface absolute -bottom-0.5 -right-0.5" />
          )}
        </div>

        {/* Display name where space allows */}
        <div className="hidden sm:flex flex-col text-left min-w-0">
          <span className="text-xs font-semibold text-foreground truncate max-w-[120px] leading-tight group-hover:text-primary-light transition-colors">
            {fullName}
          </span>
          <span className="text-[10px] text-foreground-muted font-mono truncate max-w-[120px]">
            {user?.role || "Workspace"}
          </span>
        </div>

        {/* Dropdown chevron */}
        <ChevronDown
          size={14}
          className={`text-foreground-muted group-hover:text-foreground transition-transform duration-200 ml-0.5 ${
            open ? "rotate-180 text-primary-light" : ""
          }`}
        />
      </button>

      {/* DROPDOWN MENU */}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-labelledby="account-menu-trigger"
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 top-full mt-2 w-64 bg-surface/95 border border-border rounded-2xl shadow-2xl py-1.5 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
        >
          {/* 1. USER IDENTITY SECTION */}
          <div className="px-4 py-3 border-b border-border/40 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-subtle border border-primary-light/35 flex items-center justify-center font-bold text-sm text-primary-light shrink-0 shadow-xs">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs text-foreground truncate leading-tight">
                {fullName}
              </div>
              <div
                className="text-[11px] text-foreground-muted font-mono truncate mt-0.5"
                title={email}
              >
                {email}
              </div>
            </div>
          </div>

          <div className="py-1">
            {/* WORKSPACE INVITATIONS */}
            <Link
              href="/dashboard/invitations"
              role="menuitem"
              tabIndex={0}
              onClick={handleClose}
              className="flex items-center justify-between px-4 py-2 text-xs text-foreground hover:bg-surface-elevated hover:text-primary-light transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Mail
                  size={15}
                  className="text-foreground-muted group-hover:text-primary-light transition-colors shrink-0"
                />
                <span className="font-medium">Invitations</span>
              </div>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono leading-none">
                  {pendingCount}
                </span>
              )}
            </Link>

            {/* 2. MY PROFILE */}
            <Link
              href="/dashboard/account#profile"
              role="menuitem"
              tabIndex={0}
              onClick={handleClose}
              className="flex items-center gap-2.5 px-4 py-2 text-xs text-foreground hover:bg-surface-elevated hover:text-primary-light transition-colors group"
            >
              <User
                size={15}
                className="text-foreground-muted group-hover:text-primary-light transition-colors shrink-0"
              />
              <span className="font-medium">My Profile</span>
            </Link>

            {/* 3. SECURITY & PASSWORD */}
            <Link
              href="/dashboard/account#security"
              role="menuitem"
              tabIndex={0}
              onClick={handleClose}
              className="flex items-center gap-2.5 px-4 py-2 text-xs text-foreground hover:bg-surface-elevated hover:text-primary-light transition-colors group"
            >
              <KeyRound
                size={15}
                className="text-foreground-muted group-hover:text-primary-light transition-colors shrink-0"
              />
              <span className="font-medium">Security & Password</span>
            </Link>

            {/* 4. PREFERENCES */}
            <Link
              href="/dashboard/account#preferences"
              role="menuitem"
              tabIndex={0}
              onClick={handleClose}
              className="flex items-center gap-2.5 px-4 py-2 text-xs text-foreground hover:bg-surface-elevated hover:text-primary-light transition-colors group"
            >
              <Sliders
                size={15}
                className="text-foreground-muted group-hover:text-primary-light transition-colors shrink-0"
              />
              <span className="font-medium">Preferences</span>
            </Link>

            {/* 5. HELP & SUPPORT */}
            <Link
              href="/support"
              role="menuitem"
              tabIndex={0}
              onClick={handleClose}
              className="flex items-center gap-2.5 px-4 py-2 text-xs text-foreground hover:bg-surface-elevated hover:text-primary-light transition-colors group"
            >
              <HelpCircle
                size={15}
                className="text-foreground-muted group-hover:text-primary-light transition-colors shrink-0"
              />
              <span className="font-medium">Help & Support</span>
            </Link>
          </div>

          {/* OPTIONAL PLATFORM ADMIN SHORTCUT */}
          {user?.isPlatformAdmin && (
            <div className="py-1 border-t border-border/30">
              <Link
                href="/dashboard/admin"
                role="menuitem"
                tabIndex={0}
                onClick={handleClose}
                className="flex items-center justify-between px-4 py-2 text-xs text-amber-500 hover:bg-surface-elevated transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Shield size={14} className="shrink-0" />
                  <span className="font-medium">Admin Console</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/30">
                  ROOT
                </span>
              </Link>
            </div>
          )}

          {/* OPTIONAL DEMO SIMULATOR SHORTCUT */}
          {hasDemo && (
            <div className="py-1 border-t border-border/30">
              <button
                type="button"
                role="menuitem"
                tabIndex={0}
                onClick={() => {
                  handleClose();
                  if (onOpenDemoTools) onOpenDemoTools();
                }}
                className="w-full text-left flex items-center justify-between px-4 py-2 text-xs text-warning hover:bg-surface-elevated transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Wrench size={14} className="shrink-0" />
                  <span className="font-medium">Demo Simulator</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-warning/10 border border-warning/30">
                  LOCAL
                </span>
              </button>
            </div>
          )}

          {/* 6. SIGN OUT */}
          <div className="pt-1 border-t border-border/40 mt-1">
            <button
              type="button"
              role="menuitem"
              tabIndex={0}
              onClick={async () => {
                handleClose();
                await onLogout();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-danger hover:bg-danger/10 hover:text-danger font-medium transition-colors text-left"
            >
              <LogOut size={15} className="shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
