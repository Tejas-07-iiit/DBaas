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
import { isDemoEnabled } from "@/lib/auth/demo/demoConfig";
import { getDemoSession, clearDemoSession } from "@/lib/auth/demo/demoSession";
import { resetDemoData } from "@/lib/demo/db";
import { useRouter } from "next/navigation";
import { DemoToolsModal } from "@/components/demo/DemoToolsModal";

export default function AccountPage() {
  const { user, logout } = useAuth();
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
      alert("Profile updated");
      // Actually we should just refresh the auth provider or reload.
      window.location.reload(); 
    }
  });

  const resetMut = useMutation({
    mutationFn: () => authApi.forgotPassword({ email: user?.email || "" }),
    onSuccess: () => {
      setResetSent(true);
      setResetCooldown(30);
      const int = setInterval(() => {
        setResetCooldown(prev => {
          if (prev <= 1) { clearInterval(int); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
  });

  const deleteMut = useMutation({
    mutationFn: async () => {
      if (isDemoEnabled() && getDemoSession()) {
        const db = require('@/lib/demo/db').getDemoData();
        const owned = db.members.filter((m: any) => m.email === db.user.email && m.role === 'Owner');
        if (owned.length > 0) throw { status: 409, body: { message: "You own projects. Delete them first." } };
        require('@/lib/demo/db').resetDemoData();
        require('@/lib/auth/demo/demoSession').clearDemoSession();
        return;
      }
      return deleteAccount();
    },
    onSuccess: async () => {
      alert("Account deleted.");
      await logout();
      router.push("/");
    },
    onError: (err: any) => {
       if (err.status === 409 || err.status === 422) {
          setDeleteErr(err.body?.message || "You can't delete your account yet.");
       } else {
          setDeleteErr("An error occurred");
       }
       setDeleteOpen(false);
    }
  });

  return (
    <div className="max-w-3xl animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold mb-8">Account</h1>

      {/* PROFILE CARD */}
      <div className="bg-surface/30 border border-border/50 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold mb-6">Profile</h2>
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-16 h-16 rounded-full border border-accent flex items-center justify-center text-xl font-bold bg-surface-2 shrink-0 text-text">
            {initials}
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded px-4 py-2 text-text outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Email</label>
              <input 
                type="email" 
                value={user?.email || ""} 
                disabled
                className="w-full bg-surface-2 border border-border rounded px-4 py-2 text-muted opacity-50 cursor-not-allowed"
              />
            </div>
            <button 
              onClick={() => updateMut.mutate()} 
              disabled={!isDirty || updateMut.isPending}
              className="px-4 py-2 bg-text text-bg rounded font-bold text-sm disabled:opacity-50 transition-opacity mt-2"
            >
              {updateMut.isPending ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </div>

      {/* PASSWORD CARD */}
      <div className="bg-surface/30 border border-border/50 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold mb-2">Password</h2>
        <p className="text-sm text-muted mb-4">Reset your password by email.</p>
        
        {resetSent && <div className="mb-4 p-3 bg-[#3FCF6D]/10 border border-[#3FCF6D]/30 text-[#3FCF6D] text-sm rounded">If an account exists, a reset email has been sent.</div>}
        
        <button 
          onClick={() => resetMut.mutate()} 
          disabled={resetCooldown > 0 || resetMut.isPending}
          className="px-4 py-2 border border-border/50 rounded font-bold text-sm disabled:opacity-50 hover:bg-surface-2 transition-colors"
        >
          {resetCooldown > 0 ? `Wait ${resetCooldown}s` : resetMut.isPending ? "Sending..." : "Send reset email"}
        </button>
      </div>

      {/* DEMO CARD */}
      {isDemoEnabled() && getDemoSession() && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-amber-500 mb-1">Demo Mode</h2>
            <p className="text-sm text-amber-500/80">You can adjust local demo settings.</p>
          </div>
          <button onClick={() => setDemoOpen(true)} className="px-4 py-2 bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded font-bold text-sm hover:bg-amber-500/30 transition-colors">Demo tools</button>
        </div>
      )}

      {deleteErr && <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4" onClick={() => setDeleteErr("")}>
        <div className="bg-surface border border-border/50 p-6 rounded-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
           <h2 className="text-xl font-bold mb-4">You can't delete your account yet</h2>
           <p className="text-sm text-muted mb-6">{deleteErr}</p>
           <button onClick={() => setDeleteErr("")} className="w-full px-4 py-2 border border-border/50 rounded font-bold">Close</button>
        </div>
      </div>}
      {/* DANGER ZONE */}
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
        <h2 className="text-lg font-bold text-red-400 mb-2">Danger zone</h2>
        <p className="text-sm text-red-400/80 mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
        <button 
          onClick={() => setDeleteOpen(true)}
          className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 rounded font-bold text-sm transition-colors"
        >
          Delete account
        </button>
      </div>

      <ConfirmDialog 
        isOpen={deleteOpen} 
        onClose={() => setDeleteOpen(false)} 
        title="Delete account"
        message="This will immediately and permanently delete your account, projects, and databases. There is no recovery."
        confirmText="Permanently delete account"
        danger={true}
        requireType="DELETE"
        onConfirm={() => deleteMut.mutate()}
      />
      <DemoToolsModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
