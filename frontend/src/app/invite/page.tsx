/**
 * @file src/app/invite/page.tsx
 * @description Public invitation onboarding and workspace acceptance page.
 * Validates invitation tokens, displays inviter/project context, and completes membership grants.
 */

"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getInvitation, acceptInvitation } from "@/lib/api/invitations";
import { useAuth } from "@/lib/auth/AuthProvider";
import { toast } from "@/components/providers/ToastProvider";
import { RoleBadge } from "@/components/dashboard/RoleBadge";
import {
  Mail,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Shield,
  Layers,
  LogIn,
  UserPlus,
} from "lucide-react";

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const { user, status, logout } = useAuth();
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState(false);

  const handleSwitchAccount = async (targetPath: "login" | "signup") => {
    try {
      setSwitchingAccount(true);
      await logout();
      const redirectUrl = encodeURIComponent(`/invite?token=${token}`);
      const emailParam = encodeURIComponent(invitation?.email || "");
      router.push(`/${targetPath}?redirect=${redirectUrl}&email=${emailParam}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to sign out");
      setSwitchingAccount(false);
    }
  };

  const inviteQuery = useQuery({
    queryKey: ["invitation", token],
    queryFn: () => getInvitation(token),
    enabled: !!token,
    retry: false,
  });

  const acceptMut = useMutation({
    mutationFn: () => acceptInvitation(token),
    onSuccess: (data) => {
      setAcceptedSuccess(true);
      toast.success(`Welcome to ${data.projectName || "the project"}!`);
      setTimeout(() => {
        router.push(`/dashboard/projects/${data.projectId}`);
      }, 1200);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to accept invitation");
    },
  });

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
          <AlertTriangle size={24} />
        </div>
        <h1 className="text-xl font-bold text-foreground">Missing Invitation Token</h1>
        <p className="text-xs text-foreground-muted max-w-sm mx-auto">
          No invitation token was provided in the URL. Please verify the invitation link from your email.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-surface-elevated hover:bg-surface border border-border rounded-xl text-xs font-medium text-foreground transition-colors"
        >
          <span>Go to Console</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  if (inviteQuery.isLoading) {
    return (
      <div className="text-center py-12 space-y-3">
        <Loader2 size={32} className="animate-spin text-primary-light mx-auto" />
        <p className="text-xs text-foreground-muted font-mono">Validating invitation credentials...</p>
      </div>
    );
  }

  if (inviteQuery.error || !inviteQuery.data) {
    const errorMsg =
      (inviteQuery.error as any)?.message ||
      "This invitation link is invalid, has expired, or was revoked.";
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mx-auto">
          <AlertTriangle size={24} />
        </div>
        <h1 className="text-xl font-bold text-foreground">Invitation Unavailable</h1>
        <p className="text-xs text-foreground-muted max-w-sm mx-auto">{errorMsg}</p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-surface-elevated hover:bg-surface border border-border rounded-xl text-xs font-medium text-foreground transition-colors"
          >
            <span>Dashboard</span>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-medium transition-colors"
          >
            <span>Sign In</span>
          </Link>
        </div>
      </div>
    );
  }

  const invitation = inviteQuery.data;

  if (acceptedSuccess) {
    return (
      <div className="text-center space-y-4 py-6">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto animate-bounce">
          <CheckCircle2 size={30} />
        </div>
        <h1 className="text-xl font-bold text-foreground">Invitation Accepted!</h1>
        <p className="text-xs text-foreground-muted">
          Redirecting you to the <strong>{invitation.projectName}</strong> workspace...
        </p>
        <div className="flex justify-center">
          <Loader2 size={16} className="animate-spin text-primary-light" />
        </div>
      </div>
    );
  }

  const isEmailMatching =
    user?.email &&
    invitation.email &&
    user.email.toLowerCase() === invitation.email.toLowerCase();

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary-light border border-primary/20 flex items-center justify-center mx-auto shadow-sm">
          <Mail size={22} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Workspace Invitation
        </h1>
        <p className="text-xs text-foreground-muted max-w-md mx-auto">
          <strong>{invitation.invitedBy?.name || invitation.invitedBy?.email || "A project admin"}</strong>{" "}
          has invited you to collaborate on DBaaS.
        </p>
      </div>

      {/* INVITATION DETAILS CARD */}
      <div className="bg-surface/80 border border-border/80 rounded-2xl p-5 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-subtle border border-primary/20 flex items-center justify-center text-primary-light">
              <Layers size={16} />
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground">Project Workspace</div>
              <div className="text-sm font-bold text-foreground">{invitation.projectName}</div>
            </div>
          </div>
          <RoleBadge role={invitation.role} />
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center text-foreground-muted">
            <span>Invited Email:</span>
            <span className="font-mono text-foreground font-medium">{invitation.email}</span>
          </div>
          <div className="flex justify-between items-center text-foreground-muted">
            <span>Invited By:</span>
            <span className="text-foreground">{invitation.invitedBy?.email}</span>
          </div>
          <div className="flex justify-between items-center text-foreground-muted">
            <span>Link Expires:</span>
            <span className="text-foreground">
              {new Date(invitation.expiresAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* AUTHENTICATION & ACCEPTANCE ACTIONS */}
      {status === "loading" ? (
        <div className="flex justify-center py-4">
          <Loader2 size={20} className="animate-spin text-primary-light" />
        </div>
      ) : status === "authenticated" && user ? (
        <div className="space-y-4">
          {!isEmailMatching ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-amber-300">
                    Account Mismatch Detected
                  </div>
                  <p className="text-xs text-foreground-muted leading-relaxed">
                    You are currently signed in as <strong className="text-foreground">{user.email}</strong>, but this invitation was sent specifically to <strong className="text-foreground">{invitation.email}</strong>.
                  </p>
                  <p className="text-[11px] text-foreground-muted/80">
                    To maintain access security, you must accept this invitation using the invited email account.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSwitchAccount("login")}
                  disabled={switchingAccount}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-surface hover:bg-surface-elevated border border-border text-foreground font-semibold text-xs rounded-xl transition-all shadow-xs disabled:opacity-50"
                >
                  {switchingAccount ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <LogIn size={13} className="text-primary-light" />
                  )}
                  <span>Sign In as {invitation.email.split("@")[0]}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchAccount("signup")}
                  disabled={switchingAccount}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary-light font-semibold text-xs rounded-xl transition-all shadow-xs disabled:opacity-50"
                >
                  {switchingAccount ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <UserPlus size={13} />
                  )}
                  <span>Create Account</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between text-emerald-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  <span>Signed in as <strong>{user.email}</strong> (Matches invitation)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => acceptMut.mutate()}
                disabled={acceptMut.isPending}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-xl shadow-md transition-colors disabled:opacity-50"
              >
                {acceptMut.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                <span>Accept Invitation & Join Project</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3 pt-2">
          <div className="text-center text-xs text-foreground-muted">
            Sign in or create an account to accept this invitation:
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href={`/login?redirect=/invite?token=${encodeURIComponent(token)}`}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-surface hover:bg-surface-elevated border border-border text-foreground font-semibold text-xs rounded-xl transition-colors shadow-xs"
            >
              <LogIn size={15} />
              <span>Sign In</span>
            </Link>
            <Link
              href={`/signup?redirect=/invite?token=${encodeURIComponent(token)}&email=${encodeURIComponent(invitation.email)}`}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded-xl transition-colors shadow-xs"
            >
              <UserPlus size={15} />
              <span>Create Account</span>
            </Link>
          </div>
        </div>
      )}

      {/* FOOTER NOTICE */}
      <div className="text-center">
        <p className="text-[11px] text-foreground-muted/60">
          Protected by DBaaS Role-Based Access Control (RBAC).
        </p>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md bg-surface-elevated border border-border/80 rounded-3xl p-7 shadow-xl">
        <Suspense
          fallback={
            <div className="text-center py-12 space-y-3">
              <Loader2 size={32} className="animate-spin text-primary-light mx-auto" />
              <p className="text-xs text-foreground-muted font-mono">Loading invitation...</p>
            </div>
          }
        >
          <InviteContent />
        </Suspense>
      </div>
    </div>
  );
}
