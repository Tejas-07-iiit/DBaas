/**
 * @file src/app/dashboard/projects/[projectId]/team/page.tsx
 * @description Project team management, membership roster, and email invitations.
 * Enables inviting collaborators by email, tracking pending invitations, updating roles,
 * and managing membership with full RBAC enforcement.
 */

"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listMembers, updateMemberRole, removeMember } from "@/lib/api/members";
import {
  listInvitations,
  createInvitation,
  revokeInvitation,
  resendInvitation,
} from "@/lib/api/invitations";
import { getProject } from "@/lib/api/projects";
import { mapProject } from "@/lib/api/mappers";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { RoleBadge } from "@/components/dashboard/RoleBadge";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { toast } from "@/components/providers/ToastProvider";
import {
  Users,
  Plus,
  Trash2,
  X,
  Shield,
  Loader2,
  Mail,
  RotateCcw,
  Clock,
  Send,
  AlertCircle,
  RefreshCw,
  Crown,
  KeyRound,
  Eye,
  Check,
} from "lucide-react";

export default function TeamPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"members" | "invitations">("members");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [inviteErr, setInviteErr] = useState("");

  const [removeId, setRemoveId] = useState("");
  const [revokeId, setRevokeId] = useState("");
  const [resendingId, setResendingId] = useState<string | null>(null);

  // PROJECT QUERY
  const projQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const r: any = await getProject(projectId);
      return mapProject(r.data || r);
    },
  });

  const isOwnerAdmin =
    (projQuery.data?.role || "").toUpperCase() === "OWNER" ||
    (projQuery.data?.role || "").toUpperCase() === "ADMIN";

  // ACTIVE MEMBERS QUERY (With 5s auto-polling to detect newly accepted members)
  const memQuery = useQuery({
    queryKey: ["members", projectId],
    queryFn: async () => {
      const r: any = await listMembers(projectId);
      return r.data || r;
    },
    refetchInterval: 5000,
  });

  // PENDING INVITATIONS QUERY (With 5s auto-polling)
  const invQuery = useQuery({
    queryKey: ["invitations", projectId],
    queryFn: () => listInvitations(projectId),
    enabled: isOwnerAdmin,
    refetchInterval: 5000,
  });

  const members = Array.isArray(memQuery.data) ? memQuery.data : [];
  const invitations = Array.isArray(invQuery.data) ? invQuery.data : [];
  const pendingInvitations = invitations.filter(
    (inv: any) => (inv.status || "").toUpperCase() === "PENDING",
  );
  const ownerCount =
    members.filter((m: any) => (m.role || "").toUpperCase() === "OWNER").length || 0;

  // Manual refresh handler
  const handleManualRefresh = () => {
    memQuery.refetch();
    if (isOwnerAdmin) {
      invQuery.refetch();
    }
    toast.success("Roster refreshed");
  };

  // INVITE MUTATION (Sends Email)
  const inviteMut = useMutation({
    mutationFn: () => createInvitation(projectId, { email, role }),
    onSuccess: () => {
      toast.success(`Invitation email sent to ${email}`);
      queryClient.invalidateQueries({ queryKey: ["invitations", projectId] });
      queryClient.invalidateQueries({ queryKey: ["members", projectId] });
      setInviteOpen(false);
      setEmail("");
      setRole("MEMBER");
      setInviteErr("");
      setActiveTab("invitations");
    },
    onError: (err: any) => {
      const msg = err.message || "Failed to send invitation email";
      setInviteErr(msg);
      toast.error(msg);
    },
  });

  // UPDATE ROLE MUTATION
  const roleMut = useMutation({
    mutationFn: (args: { id: string; r: string }) =>
      updateMemberRole(projectId, args.id, args.r),
    onSuccess: () => {
      toast.success("Member role updated successfully");
      queryClient.invalidateQueries({ queryKey: ["members", projectId] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to change role"),
  });

  // REMOVE MEMBER MUTATION
  const removeMut = useMutation({
    mutationFn: (id: string) => removeMember(projectId, id),
    onSuccess: () => {
      toast.success("Member removed from project");
      queryClient.invalidateQueries({ queryKey: ["members", projectId] });
      setRemoveId("");
    },
    onError: (err: any) => toast.error(err.message || "Failed to remove member"),
  });

  // REVOKE INVITATION MUTATION
  const revokeMut = useMutation({
    mutationFn: (invId: string) => revokeInvitation(projectId, invId),
    onSuccess: () => {
      toast.success("Invitation revoked");
      queryClient.invalidateQueries({ queryKey: ["invitations", projectId] });
      setRevokeId("");
    },
    onError: (err: any) => toast.error(err.message || "Failed to revoke invitation"),
  });

  // RESEND INVITATION
  const handleResend = async (invId: string, recipientEmail: string) => {
    try {
      setResendingId(invId);
      await resendInvitation(projectId, invId);
      toast.success(`Invitation email resent to ${recipientEmail}`);
      queryClient.invalidateQueries({ queryKey: ["invitations", projectId] });
    } catch (err: any) {
      toast.error(err.message || "Failed to resend invitation email");
    } finally {
      setResendingId(null);
    }
  };

  if (projQuery.isLoading)
    return <div className="p-8 text-center text-foreground-muted text-xs font-mono">Loading team roster...</div>;
  if (projQuery.error) return <ErrorState error={projQuery.error} />;

  const isRefreshing = memQuery.isFetching || invQuery.isFetching;

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Team & Permissions</h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-surface-elevated border border-border/70 text-foreground-muted">
              {members.length} {members.length === 1 ? "collaborator" : "collaborators"}
            </span>
          </div>
          <p className="text-foreground-muted text-xs mt-1 leading-relaxed">
            Manage workspace collaborators, send email invites, and configure role grants for{" "}
            <strong className="text-foreground">{projQuery.data?.name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Manual Refresh Button */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface-elevated border border-border/80 text-foreground-muted hover:text-foreground rounded-xl text-xs font-medium transition-all shadow-xs disabled:opacity-50"
            title="Refresh collaborators and pending invitations"
          >
            <RefreshCw size={13} className={isRefreshing ? "animate-spin text-primary-light" : ""} />
            <span>Refresh</span>
          </button>

          {/* Invite Member Button (Only for Owner/Admin) */}
          {isOwnerAdmin && (
            <button
              onClick={() => {
                setInviteErr("");
                setInviteOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium text-xs transition-colors shadow-sm"
            >
              <Plus size={15} />
              <span>Invite Member</span>
            </button>
          )}
        </div>
      </div>

      {/* READ-ONLY BANNER FOR MEMBER ROLE */}
      {!isOwnerAdmin && (
        <div className="flex items-start sm:items-center gap-3.5 p-4 bg-primary/5 border border-primary/20 rounded-2xl shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary-light border border-primary/25 flex items-center justify-center shrink-0">
            <Shield size={18} />
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-foreground">
              Read-Only (Member) Workspace Permissions
            </div>
            <p className="text-[11px] text-foreground-muted leading-relaxed">
              You are signed in with collaborator access. You have full visibility into database metrics, cluster configurations, and active team members. Inviting new collaborators and role assignment require Admin or Owner permissions.
            </p>
          </div>
        </div>
      )}

      {/* TABS SELECTOR */}
      <div className="flex items-center gap-2 border-b border-border/50 pb-2">
        <button
          onClick={() => setActiveTab("members")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "members"
              ? "bg-surface-elevated text-foreground shadow-xs border border-border/80"
              : "text-foreground-muted hover:text-foreground hover:bg-surface"
          }`}
        >
          <Users size={14} />
          <span>Active Collaborators</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface border border-border/70 text-foreground-muted">
            {members.length}
          </span>
        </button>

        {isOwnerAdmin && (
          <button
            onClick={() => setActiveTab("invitations")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "invitations"
                ? "bg-surface-elevated text-foreground shadow-xs border border-border/80"
                : "text-foreground-muted hover:text-foreground hover:bg-surface"
            }`}
          >
            <Mail size={14} />
            <span>Pending Email Invitations</span>
            {pendingInvitations.length > 0 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/20 text-primary-light border border-primary/30">
                {pendingInvitations.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* FULL-WIDTH ROSTER TABLE SECTION */}
      <div className="space-y-4">
        {activeTab === "members" ? (
          /* ACTIVE MEMBERS TABLE */
          <div className="bg-surface-elevated border border-border/80 rounded-2xl overflow-hidden shadow-sm">
            {memQuery.isLoading ? (
              <div className="p-12 text-center text-foreground-muted text-xs">Loading collaborators...</div>
            ) : memQuery.error ? (
              <ErrorState error={memQuery.error} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface/60 text-foreground-muted uppercase text-[10px] font-semibold tracking-wider border-b border-border/60">
                    <tr>
                      <th className="px-6 py-4">Collaborator</th>
                      <th className="px-6 py-4">Workspace Role</th>
                      <th className="px-6 py-4">Joined Date</th>
                      {isOwnerAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {members.map((m: any) => {
                      const roleUpper = (m.role || "").toUpperCase();
                      const targetUserId = m.userId || m.id;
                      const isOwner = roleUpper === "OWNER";
                      return (
                        <tr key={m.id} className="hover:bg-surface/50 transition-colors">
                          <td className="px-6 py-4 flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary-light flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
                              {(m.name || m.email || "U").substring(0, 2).toUpperCase()}
                            </div>
                            <div className="space-y-0.5">
                              <div className="font-semibold text-sm text-foreground">{m.name || "Collaborator"}</div>
                              <div className="text-[11px] text-foreground-muted font-mono">{m.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {isOwnerAdmin && !isOwner ? (
                              <select
                                value={roleUpper}
                                onChange={(e) =>
                                  roleMut.mutate({ id: targetUserId, r: e.target.value })
                                }
                                disabled={roleMut.isPending}
                                className="bg-surface border border-border/80 rounded-xl px-3 py-1.5 text-xs text-foreground font-medium outline-none focus:border-primary-light disabled:opacity-40 transition-colors shadow-xs"
                              >
                                <option value="ADMIN">Admin (Read/Write)</option>
                                <option value="MEMBER">Member (Read-Only)</option>
                              </select>
                            ) : (
                              <RoleBadge role={m.role} />
                            )}
                          </td>
                          <td className="px-6 py-4 text-foreground-muted font-mono text-[11px]">
                            {new Date(m.joinedAt).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          {isOwnerAdmin && (
                            <td className="px-6 py-4 text-right">
                              <button
                                disabled={(isOwner && ownerCount <= 1) || removeMut.isPending}
                                onClick={() => setRemoveId(targetUserId)}
                                className="p-2 text-foreground-muted hover:text-red-400 hover:bg-surface rounded-xl transition-colors disabled:opacity-20"
                                title={
                                  isOwner && ownerCount <= 1
                                    ? "Cannot remove last project owner"
                                    : "Remove collaborator"
                                }
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* PENDING EMAIL INVITATIONS TABLE */
          <div className="bg-surface-elevated border border-border/80 rounded-2xl overflow-hidden shadow-sm">
            {invQuery.isLoading ? (
              <div className="p-12 text-center text-foreground-muted text-xs">Loading invitations...</div>
            ) : pendingInvitations.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-surface border border-border/70 flex items-center justify-center text-foreground-muted mx-auto">
                  <Mail size={20} />
                </div>
                <div className="font-semibold text-sm text-foreground">No Pending Invitations</div>
                <p className="text-xs text-foreground-muted max-w-sm mx-auto leading-relaxed">
                  When you invite team members using their email address, their pending invitation status
                  and 7-day token link will be listed here.
                </p>
                <button
                  onClick={() => {
                    setInviteErr("");
                    setInviteOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-medium transition-colors shadow-sm"
                >
                  <Plus size={14} />
                  <span>Invite a Collaborator</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface/60 text-foreground-muted uppercase text-[10px] font-semibold tracking-wider border-b border-border/60">
                    <tr>
                      <th className="px-6 py-4">Invited Recipient</th>
                      <th className="px-6 py-4">Assigned Role</th>
                      <th className="px-6 py-4">Invited By</th>
                      <th className="px-6 py-4">Expires</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {pendingInvitations.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-surface/50 transition-colors">
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-light font-bold text-xs shrink-0 shadow-inner">
                            <Mail size={16} />
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-foreground font-mono">{inv.email}</div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                              <Clock size={10} />
                              Pending Acceptance
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <RoleBadge role={inv.role} />
                        </td>
                        <td className="px-6 py-4 text-foreground-muted text-[11px]">
                          {inv.invitedBy?.name || inv.invitedBy?.email || "Admin"}
                        </td>
                        <td className="px-6 py-4 text-foreground-muted font-mono text-[11px]">
                          {new Date(inv.expiresAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleResend(inv.id, inv.email)}
                              disabled={resendingId === inv.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground-muted hover:text-foreground bg-surface hover:bg-surface-elevated border border-border/80 rounded-xl transition-colors disabled:opacity-40 shadow-xs"
                              title="Resend invitation email"
                            >
                              {resendingId === inv.id ? (
                                <Loader2 size={12} className="animate-spin text-primary-light" />
                              ) : (
                                <RotateCcw size={12} />
                              )}
                              <span>Resend</span>
                            </button>

                            <button
                              onClick={() => setRevokeId(inv.id)}
                              className="p-1.5 text-foreground-muted hover:text-red-400 hover:bg-surface rounded-lg transition-colors"
                              title="Revoke invitation"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ROLE PRIVILEGES & PERMISSIONS REFERENCE (Sleek Bottom 3-Card Grid) */}
      <div className="space-y-4 pt-4 border-t border-border/40">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Role Privileges & Workspace Access (RBAC)
          </h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Understand granted privileges and permission boundaries across your DBaaS project.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* OWNER CARD */}
          <div className="bg-surface-elevated border border-primary/20 rounded-2xl p-5 space-y-3 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between pb-2.5 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Crown size={16} className="text-primary-light" />
                <span className="font-bold text-sm text-foreground">Owner</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary-light border border-primary/20 font-semibold">
                Root
              </span>
            </div>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Full administrative authority over the workspace. Controls host VM lifecycle, billing tiers, member role upgrades, and permanent workspace deletion.
            </p>
            <div className="space-y-1.5 text-[11px] text-foreground-muted/90 pt-1">
              <div className="flex items-center gap-1.5">
                <Check size={12} className="text-primary-light" />
                <span>Host VM start, stop, restart</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check size={12} className="text-primary-light" />
                <span>Create, scale, and delete databases</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check size={12} className="text-primary-light" />
                <span>Assign Owner & Admin roles</span>
              </div>
            </div>
          </div>

          {/* ADMIN CARD */}
          <div className="bg-surface-elevated border border-border/80 rounded-2xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-border/50">
              <div className="flex items-center gap-2">
                <KeyRound size={16} className="text-violet-400" />
                <span className="font-bold text-sm text-foreground">Admin</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-semibold">
                Read / Write
              </span>
            </div>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Manage day-to-day operations. Can provision database clusters, rotate credentials, invite collaborators, and adjust cluster configurations.
            </p>
            <div className="space-y-1.5 text-[11px] text-foreground-muted/90 pt-1">
              <div className="flex items-center gap-1.5">
                <Check size={12} className="text-primary-light" />
                <span>Provision & configure databases</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check size={12} className="text-primary-light" />
                <span>Rotate credentials & inspect secrets</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check size={12} className="text-primary-light" />
                <span>Invite Member collaborators</span>
              </div>
            </div>
          </div>

          {/* MEMBER CARD */}
          <div className="bg-surface-elevated border border-border/80 rounded-2xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-zinc-400" />
                <span className="font-bold text-sm text-foreground">Member</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 font-semibold">
                Read-Only
              </span>
            </div>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Inspect database status, telemetry metrics, logs, and schema explorers. Strictly prohibited from triggering cluster modifications or data mutations.
            </p>
            <div className="space-y-1.5 text-[11px] text-foreground-muted/90 pt-1">
              <div className="flex items-center gap-1.5">
                <Check size={12} className="text-primary-light" />
                <span>Inspect real-time telemetry metrics</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check size={12} className="text-primary-light" />
                <span>View schema & data explorer</span>
              </div>
              <div className="flex items-center gap-1.5">
                <X size={12} className="text-red-400" />
                <span>Cannot mutate, restart, or delete</span>
              </div>
            </div>
          </div>
        </div>

        {/* EMAIL DISPATCH DETAILS CARD */}
        <div className="bg-surface-elevated border border-border/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary-light border border-primary/20 flex items-center justify-center shrink-0">
              <Send size={16} />
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-foreground">Zero Pre-Registration Required</div>
              <p className="text-[11px] text-foreground-muted leading-relaxed">
                Invitations are dispatched directly to the recipient&apos;s mailbox with a secure cryptographic token valid for 7 days. Recipients can accept the invitation using an existing or new account.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-xl bg-surface border border-border/60 text-foreground-muted">
              Token Expiration: 7 Days
            </span>
          </div>
        </div>
      </div>

      {/* INVITE MODAL */}
      {inviteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setInviteOpen(false)}
        >
          <div
            className="bg-surface-elevated border border-border/80 p-6 rounded-2xl w-full max-w-sm shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary-light flex items-center justify-center">
                  <Mail size={15} />
                </div>
                <h2 className="text-base font-semibold text-foreground">Invite via Email</h2>
              </div>
              <button
                onClick={() => setInviteOpen(false)}
                className="text-foreground-muted hover:text-foreground p-1.5 rounded-lg hover:bg-surface transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {inviteErr && (
              <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 p-2.5 rounded-xl flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{inviteErr}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-foreground-muted mb-1.5">Recipient Email Address</label>
                <input
                  type="email"
                  autoFocus
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface border border-border/70 rounded-xl px-3.5 py-2 text-xs text-foreground outline-none focus:border-primary-light transition-colors"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground-muted mb-1.5">Workspace Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-surface border border-border/70 rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-primary-light transition-colors"
                >
                  <option value="ADMIN">Admin (Can manage databases & members)</option>
                  <option value="MEMBER">Member (Read-only access)</option>
                </select>
              </div>

              <div className="p-3 bg-surface rounded-xl border border-border/50 text-[11px] text-foreground-muted flex items-center gap-2">
                <Clock size={14} className="text-primary-light shrink-0" />
                <span>The invitation link will remain active for 7 days.</span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-border/50">
              <button
                onClick={() => setInviteOpen(false)}
                className="px-4 py-2 text-xs font-medium text-foreground-muted hover:text-foreground hover:bg-surface rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => inviteMut.mutate()}
                disabled={inviteMut.isPending || !email.includes("@")}
                className="flex items-center gap-2 px-5 py-2 text-xs font-medium bg-primary hover:bg-primary-hover text-white rounded-xl disabled:opacity-40 transition-colors shadow-sm"
              >
                {inviteMut.isPending && <Loader2 size={13} className="animate-spin" />}
                <span>Send Invitation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REMOVE MEMBER CONFIRMATION */}
      <ConfirmDialog
        isOpen={!!removeId}
        onClose={() => setRemoveId("")}
        title="Remove Member from Project"
        message="This collaborator will immediately lose access to all database clusters and telemetry in this project workspace."
        confirmText="Remove Member"
        danger
        isLoading={removeMut.isPending}
        onConfirm={() => removeMut.mutate(removeId)}
      />

      {/* REVOKE INVITATION CONFIRMATION */}
      <ConfirmDialog
        isOpen={!!revokeId}
        onClose={() => setRevokeId("")}
        title="Revoke Pending Invitation"
        message="The invitation link will immediately become invalid. The invited recipient will no longer be able to join using that link."
        confirmText="Revoke Invitation"
        danger
        isLoading={revokeMut.isPending}
        onConfirm={() => revokeMut.mutate(revokeId)}
      />
    </div>
  );
}
