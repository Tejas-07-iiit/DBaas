/**
 * @file src/app/dashboard/account/page.tsx
 * @description User account settings and profile management.
 * Provides name updating, password reset trigger, Demo Mode session reset,
 * and irreversible account deletion with confirmation.
 */

"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserProfile, deleteAccount } from "@/lib/api/user";
import { authApi } from "@/lib/api/auth";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { toast } from "@/components/providers/ToastProvider";
import { isDemoEnabled } from "@/lib/auth/demo/demoConfig";
import { getDemoSession, clearDemoSession } from "@/lib/auth/demo/demoSession";
import { resetDemoData } from "@/lib/demo/db";
import { useRouter } from "next/navigation";
import { DemoToolsModal } from "@/components/demo/DemoToolsModal";
import { useTheme } from "@/components/providers/ThemeProvider";
import { User, Lock, Wrench, AlertTriangle, KeyRound, Loader2, Palette, Sun, Moon, Monitor } from "lucide-react";

export default function AccountPage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState(user?.name || "");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);
  const [deleteErr, setDeleteErr] = useState("");

  const initials = user?.name ? user.name.substring(0, 2).toUpperCase() : "U";
  const isDirty = name !== user?.name && name.length >= 2 && name.length <= 60;

  const updateMut = useMutation({
    mutationFn: () => updateUserProfile({ name }),
    onSuccess: () => {
      toast.success("Profile updated successfully");
      window.location.reload(); 
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update profile");
    }
  });

  const resetMut = useMutation({
    mutationFn: () => authApi.forgotPassword({ email: user?.email || "" }),
    onSuccess: () => {
      toast.success("Password reset email dispatched");
      setResetSent(true);
      setResetCooldown(30);
      const int = setInterval(() => {
        setResetCooldown(prev => {
          if (prev <= 1) { clearInterval(int); return 0; }
          return prev - 1;
        });
      }, 1000);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to send reset email");
    }
  });

  const deleteMut = useMutation({
    mutationFn: async () => {
      if (isDemoEnabled() && getDemoSession()) {
        const db = require('@/lib/demo/db').getDemoData();
        const owned = db.members.filter((m: any) => m.email === db.user.email && m.role === 'Owner');
        if (owned.length > 0) throw { status: 409, message: "You own projects. Delete them first." };
        require('@/lib/demo/db').resetDemoData();
        require('@/lib/auth/demo/demoSession').clearDemoSession();
        return;
      }
      return deleteAccount();
    },
    onSuccess: async () => {
      toast.success("Account deleted successfully");
      await logout();
      router.push("/");
    },
    onError: (err: any) => {
      const msg = err.message || (err.status === 409 || err.status === 422 ? "You cannot delete your account while you own projects." : "An error occurred");
      setDeleteErr(msg);
      toast.error(msg);
      setDeleteOpen(false);
    }
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div className="pb-2 border-b border-border/30">
        <h1 className="text-2xl font-bold tracking-tight text-text">Account Settings</h1>
        <p className="text-muted text-xs mt-1">Manage user identity, security credentials, and preferences</p>
      </div>

      {/* PROFILE CARD */}
      <div id="profile" className="bg-surface/70 border border-border/70 rounded-2xl p-6 space-y-5 shadow-sm scroll-mt-20">
        <div className="flex items-center gap-2 pb-2 border-b border-border/30">
          <User size={16} className="text-accent" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text">Personal Profile</h2>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-14 h-14 rounded-2xl border border-primary-light/40 flex items-center justify-center text-lg font-bold bg-surface-2 shrink-0 text-primary-light shadow-sm">
            {initials}
          </div>
          <div className="flex-1 space-y-3.5 w-full text-xs">
            <div>
              <label className="block font-medium text-muted mb-1.5">Full Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="w-full bg-surface-2 border border-border/60 rounded-xl px-3.5 py-2 text-xs text-text outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block font-medium text-muted mb-1.5">Email Address</label>
              <input 
                type="email" 
                value={user?.email || ""} 
                disabled
                className="w-full bg-surface-2/40 border border-border/40 rounded-xl px-3.5 py-2 text-xs text-muted cursor-not-allowed font-mono"
              />
            </div>
            <div className="pt-1">
              <button 
                onClick={() => updateMut.mutate()} 
                disabled={!isDirty || updateMut.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium text-xs disabled:opacity-40 transition-colors shadow-sm"
              >
                {updateMut.isPending && <Loader2 size={13} className="animate-spin" />}
                <span>{updateMut.isPending ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* APPEARANCE / THEME CARD */}
      <div id="preferences" className="bg-surface/70 border border-border/70 rounded-2xl p-6 space-y-4 shadow-sm scroll-mt-20">
        <div className="flex items-center gap-2 pb-2 border-b border-border/30">
          <Palette size={16} className="text-accent" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text">Appearance & Interface Theme</h2>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Customize the visual theme of your developer console. Choose between Light, Dark, or automatically synchronize with your operating system preferences.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Light Theme Card */}
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
              theme === "light"
                ? "bg-surface-elevated border-primary-light shadow-md ring-1 ring-primary-light"
                : "bg-surface hover:bg-surface-elevated border-border/70"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Sun size={16} />
              </div>
              {theme === "light" && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary-light/10 text-primary-light border border-primary-light/30 font-semibold">Active</span>
              )}
            </div>
            <div>
              <div className="font-semibold text-xs text-foreground">Light Theme</div>
              <div className="text-[11px] text-muted mt-0.5">High-contrast clean surfaces for daylight work</div>
            </div>
          </button>

          {/* Dark Theme Card */}
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
              theme === "dark"
                ? "bg-surface-elevated border-primary-light shadow-md ring-1 ring-primary-light"
                : "bg-surface hover:bg-surface-elevated border-border/70"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-primary-light/10 border border-primary-light/30 flex items-center justify-center text-primary-light">
                <Moon size={16} />
              </div>
              {theme === "dark" && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary-light/10 text-primary-light border border-primary-light/30 font-semibold">Active</span>
              )}
            </div>
            <div>
              <div className="font-semibold text-xs text-foreground">Dark Theme</div>
              <div className="text-[11px] text-muted mt-0.5">Graphite & Emerald console for low-light focus</div>
            </div>
          </button>

          {/* System Sync Card */}
          <button
            type="button"
            onClick={() => setTheme("system")}
            className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
              theme === "system"
                ? "bg-surface-elevated border-primary-light shadow-md ring-1 ring-primary-light"
                : "bg-surface hover:bg-surface-elevated border-border/70"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-muted">
                <Monitor size={16} />
              </div>
              {theme === "system" && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary-light/10 text-primary-light border border-primary-light/30 font-semibold">Active</span>
              )}
            </div>
            <div>
              <div className="font-semibold text-xs text-foreground">System Default</div>
              <div className="text-[11px] text-muted mt-0.5">Automatically follows your OS appearance</div>
            </div>
          </button>
        </div>
      </div>

      {/* PASSWORD CARD */}
      <div id="security" className="bg-surface/70 border border-border/70 rounded-2xl p-6 space-y-3 shadow-sm scroll-mt-20">
        <div className="flex items-center gap-2 pb-2 border-b border-border/30">
          <KeyRound size={16} className="text-accent" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text">Password & Security</h2>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Receive a secure password reset link sent directly to your registered email address.
        </p>
        
        {resetSent && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl">
            Password reset link has been dispatched to {user?.email}.
          </div>
        )}
        
        <div>
          <button 
            onClick={() => resetMut.mutate()} 
            disabled={resetCooldown > 0 || resetMut.isPending}
            className="px-4 py-2 bg-surface-2 border border-border/60 rounded-xl font-semibold text-xs text-text hover:text-accent hover:border-accent disabled:opacity-40 transition-colors"
          >
            {resetCooldown > 0 ? `Wait ${resetCooldown}s before retry` : resetMut.isPending ? "Dispatching..." : "Send Reset Email"}
          </button>
        </div>
      </div>

      {/* DEMO CARD */}
      {isDemoEnabled() && getDemoSession() && (
        <div className="bg-amber-500/5 border border-amber-500/30 rounded-2xl p-6 flex items-center justify-between gap-4 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-amber-500 font-semibold text-xs uppercase tracking-wider mb-1">
              <Wrench size={14} />
              <span>Demo Mode Simulator Active</span>
            </div>
            <p className="text-xs text-muted">
              Configure browser latency simulation, admin roles, or reset local mock data.
            </p>
          </div>
          <button 
            onClick={() => setDemoOpen(true)} 
            className="px-4 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/20 rounded-xl font-semibold text-xs transition-colors shrink-0"
          >
            Configure Demo
          </button>
        </div>
      )}

      {deleteErr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setDeleteErr("")}>
          <div className="bg-surface border border-border/80 p-6 rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
             <h2 className="text-base font-semibold text-red-400 mb-2">Account Cannot Be Deleted</h2>
             <p className="text-xs text-muted mb-6 leading-relaxed">{deleteErr}</p>
             <button onClick={() => setDeleteErr("")} className="w-full px-4 py-2 border border-border/60 rounded-xl font-medium text-xs text-text hover:bg-surface-2">
               Close
             </button>
          </div>
        </div>
      )}

      {/* DANGER ZONE */}
      <div className="bg-red-500/5 border border-red-500/30 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-red-400 font-semibold text-xs uppercase tracking-wider">
          <AlertTriangle size={15} />
          <span>Danger Zone</span>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Permanently delete your user account and all workspace memberships. All projects you own must be deleted first.
        </p>
        <button 
          onClick={() => setDeleteOpen(true)}
          className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 rounded-xl font-semibold text-xs transition-colors"
        >
          Delete Account
        </button>
      </div>

      <ConfirmDialog 
        isOpen={deleteOpen} 
        onClose={() => setDeleteOpen(false)} 
        title="Permanently Delete Account?"
        message="This action is irreversible. Your account, credentials, and access tokens will be wiped from DBaaS Cloud."
        confirmText="Permanently Delete"
        danger={true}
        requireType="DELETE"
        isLoading={deleteMut.isPending}
        onConfirm={() => deleteMut.mutate()}
      />
      <DemoToolsModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
