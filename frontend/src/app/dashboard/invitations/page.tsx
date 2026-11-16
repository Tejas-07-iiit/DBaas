/**
 * @file src/app/dashboard/invitations/page.tsx
 * @description User-centric Workspace Invitations Console.
 * Displays all pending project invitations dispatched to the currently authenticated user's email.
 * Allows 1-click acceptance or decline directly from the dashboard after registration/login.
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getMyPendingInvitations,
  acceptInvitation,
  declineInvitation,
  MyPendingInvitation,
} from "@/lib/api/invitations";
import { useAuth } from "@/lib/auth/AuthProvider";
import { RoleBadge } from "@/components/dashboard/RoleBadge";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { toast } from "@/components/providers/ToastProvider";
import {
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  ArrowRight,
  Loader2,
  RefreshCw,
  FolderKanban,
  Shield,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useState } from "react";

export default function MyInvitationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [processingToken, setProcessingToken] = useState<string | null>(null);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["my-invitations"],
    queryFn: () => getMyPendingInvitations(),
    refetchInterval: 5000,
  });

  const acceptMut = useMutation({
    mutationFn: (token: string) => acceptInvitation(token),
    onSuccess: (res) => {
      toast.success(`Joined ${res.projectName || "project"}!`);
      queryClient.invalidateQueries({ queryKey: ["my-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setProcessingToken(null);
      router.push(`/dashboard/projects/${res.projectId}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to accept invitation");
      setProcessingToken(null);
    },
  });

  const declineMut = useMutation({
    mutationFn: (token: string) => declineInvitation(token),
    onSuccess: () => {
      toast.success("Invitation declined");
      queryClient.invalidateQueries({ queryKey: ["my-invitations"] });
      setProcessingToken(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to decline invitation");
      setProcessingToken(null);
    },
  });

  const handleAccept = (token: string) => {
    setProcessingToken(token);
    acceptMut.mutate(token);
  };

  const handleDecline = (token: string) => {
    setProcessingToken(token);
    declineMut.mutate(token);
  };

  const invitations: MyPendingInvitation[] = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-7 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Workspace Invitations
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-surface-elevated border border-border/70 text-foreground-muted">
              {invitations.length} {invitations.length === 1 ? "pending" : "pending"}
            </span>
          </div>
          <p className="text-foreground-muted text-xs mt-1 leading-relaxed">
            Project collaboration invitations dispatched to your account (
            <strong className="text-foreground font-mono">{user?.email}</strong>).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface-elevated border border-border/80 text-foreground-muted hover:text-foreground rounded-xl text-xs font-medium transition-all shadow-xs disabled:opacity-50"
            title="Refresh pending invitations"
          >
            <RefreshCw
              size={13}
              className={isFetching ? "animate-spin text-primary-light" : ""}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* CONTENT */}
      {isLoading ? (
        <div className="text-center py-16 space-y-3">
          <Loader2 size={32} className="animate-spin text-primary-light mx-auto" />
          <p className="text-xs text-foreground-muted font-mono">
            Checking for pending invitations...
          </p>
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : invitations.length === 0 ? (
        /* EMPTY STATE */
        <div className="bg-surface-elevated border border-border/70 rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary-light flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 size={28} />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-foreground">
              No Pending Invitations
            </h2>
            <p className="text-xs text-foreground-muted max-w-md mx-auto leading-relaxed">
              You are all caught up! When a team owner or administrator sends an invite to{" "}
              <strong className="text-foreground font-mono">{user?.email}</strong>, it will
              instantly appear here for 1-click acceptance.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/dashboard/projects"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-medium transition-colors shadow-sm"
            >
              <FolderKanban size={14} />
              <span>Go to My Projects</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      ) : (
        /* INVITATIONS LIST */
        <div className="space-y-4">
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center gap-3 text-xs shadow-xs">
            <Sparkles size={18} className="text-primary-light shrink-0" />
            <div className="text-foreground-muted leading-relaxed">
              You have <strong className="text-foreground">{invitations.length}</strong> active workspace{" "}
              {invitations.length === 1 ? "invitation" : "invitations"}. Accepting grants you immediate
              access to the project&apos;s clusters, databases, and metrics.
            </div>
          </div>

          <div className="grid gap-4">
            {invitations.map((inv) => {
              const isBusy = processingToken === inv.token;
              return (
                <div
                  key={inv.id}
                  className="bg-surface-elevated border border-border/80 hover:border-primary/40 rounded-2xl p-6 transition-all shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary-light flex items-center justify-center font-bold text-base shrink-0 shadow-inner">
                        <Layers size={22} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-lg font-bold tracking-tight text-foreground">
                            {inv.projectName}
                          </h3>
                          <RoleBadge role={inv.role} />
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
                          <span>
                            Invited by{" "}
                            <strong className="text-foreground">
                              {inv.invitedBy?.name || inv.invitedBy?.email || "Workspace Admin"}
                            </strong>
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Clock size={11} className="text-primary-light" />
                            Expires:{" "}
                            {new Date(inv.expiresAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex items-center gap-2.5 self-end sm:self-auto">
                      <button
                        onClick={() => handleDecline(inv.token)}
                        disabled={isBusy}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-foreground-muted hover:text-red-400 bg-surface hover:bg-surface-elevated border border-border/80 rounded-xl transition-all disabled:opacity-40 shadow-xs"
                      >
                        {isBusy && declineMut.isPending ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <XCircle size={14} />
                        )}
                        <span>Decline</span>
                      </button>

                      <button
                        onClick={() => handleAccept(inv.token)}
                        disabled={isBusy}
                        className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-primary hover:bg-primary-hover text-white rounded-xl transition-all shadow-sm disabled:opacity-50"
                      >
                        {isBusy && acceptMut.isPending ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                        <span>Accept & Join</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-foreground-muted/90 pt-1">
                    <div className="flex items-center gap-2">
                      <Shield size={13} className="text-primary-light" />
                      <span>
                        Role privileges:{" "}
                        <strong className="text-foreground font-semibold">
                          {inv.role === "ADMIN"
                            ? "Admin (Read/Write database clusters & members)"
                            : "Member (Read-Only access to telemetry & explorer)"}
                        </strong>
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-foreground-muted/70">
                      Token ID: {inv.token.slice(0, 12)}...
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
