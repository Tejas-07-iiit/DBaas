/**
 * @file src/app/dashboard/projects/[projectId]/team/page.tsx
 * @description Project team management and membership roster.
 * Enables adding members by email, updating roles, and removing collaborators with RBAC checks.
 */

"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listMembers, addMember, updateMemberRole, removeMember } from "@/lib/api/members";
import { getProject } from "@/lib/api/projects";
import { mapProject } from "@/lib/api/mappers";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { RoleBadge } from "@/components/dashboard/RoleBadge";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { toast } from "@/components/providers/ToastProvider";
import { Users, Plus, Trash2, X, Shield, ShieldAlert, UserCheck, Loader2 } from "lucide-react";

export default function TeamPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Member");
  const [inviteErr, setInviteErr] = useState("");
  
  const [removeId, setRemoveId] = useState("");

  const projQuery = useQuery({ 
    queryKey: ["project", projectId], 
    queryFn: async () => { 
      const r: any = await getProject(projectId); 
      return mapProject(r.data || r); 
    } 
  });
  
  const memQuery = useQuery({ 
    queryKey: ["members", projectId], 
    queryFn: async () => { 
      const r: any = await listMembers(projectId); 
      return r.data || r; 
    } 
  });

  const isOwnerAdmin = projQuery.data?.role === 'Owner' || projQuery.data?.role === 'Admin';
  const ownerCount = memQuery.data?.filter((m: any) => m.role === 'Owner').length || 0;

  const inviteMut = useMutation({
    mutationFn: () => addMember(projectId, { email, role }),
    onSuccess: () => {
      toast.success("Team member invited successfully");
      queryClient.invalidateQueries({ queryKey: ["members", projectId] });
      setInviteOpen(false);
      setEmail("");
      setRole("Member");
      setInviteErr("");
    },
    onError: (err: any) => {
      const msg = err.message || "Failed to invite member";
      setInviteErr(msg);
      toast.error(msg);
    }
  });

  const roleMut = useMutation({
    mutationFn: (args: {id: string, r: string}) => updateMemberRole(projectId, args.id, args.r),
    onSuccess: () => {
      toast.success("Role updated successfully");
      queryClient.invalidateQueries({ queryKey: ["members", projectId] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to change role")
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => removeMember(projectId, id),
    onSuccess: () => {
      toast.success("Member removed from project");
      queryClient.invalidateQueries({ queryKey: ["members", projectId] });
      setRemoveId("");
    },
    onError: (err: any) => toast.error(err.message || "Failed to remove member")
  });

  if (projQuery.isLoading) return <div className="p-8 text-center text-muted text-xs">Loading team roster...</div>;
  if (projQuery.error) return <ErrorState error={projQuery.error} />;

  const members = Array.isArray(memQuery.data) ? memQuery.data : [];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/30">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-text">Team & Permissions</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-surface-2 border border-border/60 text-muted">
              {members.length}
            </span>
          </div>
          <p className="text-muted text-xs mt-1">
            Manage collaborators and workspace role grants for {projQuery.data?.name}
          </p>
        </div>

        <button 
          disabled={!isOwnerAdmin} 
          onClick={() => {
            setInviteErr("");
            setInviteOpen(true);
          }} 
          className="flex items-center gap-2 px-4 py-2 bg-accent text-bg rounded-lg font-semibold text-xs disabled:opacity-40 hover:opacity-90 transition-opacity self-start sm:self-auto shadow-sm"
          title={!isOwnerAdmin ? "Only Owners and Admins can invite collaborators" : ""}
        >
          <Plus size={15} />
          <span>Invite Member</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* MEMBERS ROSTER TABLE */}
        <div className="lg:col-span-2 bg-surface/50 border border-border/60 rounded-xl overflow-hidden shadow-sm">
          {memQuery.isLoading ? (
            <div className="p-12 text-center text-muted text-xs">Loading collaborators...</div>
          ) : memQuery.error ? (
            <ErrorState error={memQuery.error} />
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-2 text-muted uppercase text-[10px] font-semibold tracking-wider border-b border-border/40">
                <tr>
                  <th className="px-6 py-3.5">Member</th>
                  <th className="px-6 py-3.5">Workspace Role</th>
                  <th className="px-6 py-3.5">Joined</th>
                  {isOwnerAdmin && <th className="px-6 py-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {members.map((m: any) => (
                  <tr key={m.id} className="hover:bg-surface-2/40 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-2 border border-border/60 flex items-center justify-center font-bold text-xs text-text shrink-0">
                        {(m.name || m.email || "U").substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-text">{m.name}</div>
                        <div className="text-[11px] text-muted font-mono">{m.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isOwnerAdmin ? (
                        <select 
                          value={m.role} 
                          onChange={e => roleMut.mutate({ id: m.id, r: e.target.value })}
                          disabled={roleMut.isPending || (m.role === 'Owner' && ownerCount <= 1)}
                          className="bg-surface-2 border border-border/60 rounded-lg px-2.5 py-1 text-xs text-text font-medium outline-none focus:border-accent disabled:opacity-40 transition-colors"
                        >
                          <option value="Owner">Owner</option>
                          <option value="Admin">Admin</option>
                          <option value="Member">Member</option>
                        </select>
                      ) : (
                        <RoleBadge role={m.role} />
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted font-mono text-[11px]">
                      {new Date(m.joinedAt).toLocaleDateString()}
                    </td>
                    {isOwnerAdmin && (
                      <td className="px-6 py-4 text-right">
                        <button 
                          disabled={m.role === 'Owner' && ownerCount <= 1 || removeMut.isPending} 
                          onClick={() => setRemoveId(m.id)} 
                          className="p-1.5 text-muted hover:text-red-400 hover:bg-surface-2 rounded-md transition-colors disabled:opacity-20" 
                          title={m.role === 'Owner' && ownerCount <= 1 ? "Cannot remove last project owner" : "Remove member"}
                        >
                          <Trash2 size={14}/>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ROLE PERMISSIONS CARD */}
        <div className="bg-surface/50 border border-border/60 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/30">
            <Shield size={16} className="text-accent" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text">Role Privileges (RBAC)</h3>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="p-3 bg-surface-2/40 rounded-lg border border-border/40 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-accent">Owner</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-accent/10 text-accent">Root</span>
              </div>
              <p className="text-muted text-[11px] leading-relaxed">
                Full administrative access including billing, subscription changes, and permanent project deletion.
              </p>
            </div>

            <div className="p-3 bg-surface-2/40 rounded-lg border border-border/40 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-400">Admin</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400">Read/Write</span>
              </div>
              <p className="text-muted text-[11px] leading-relaxed">
                Manage database provisioning, credentials rotation, and invite members. Cannot delete workspace or modify Owners.
              </p>
            </div>

            <div className="p-3 bg-surface-2/40 rounded-lg border border-border/40 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-muted">Member</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-2 text-muted">Read-Only</span>
              </div>
              <p className="text-muted text-[11px] leading-relaxed">
                Inspect database configurations, telemetry metrics, logs, and audit events. Cannot perform write or mutate operations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* INVITE MODAL */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setInviteOpen(false)}>
          <div className="bg-surface border border-border/80 p-6 rounded-xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <UserCheck size={16} className="text-accent" />
                <h2 className="text-base font-semibold text-text">Invite Team Member</h2>
              </div>
              <button onClick={() => setInviteOpen(false)} className="text-muted hover:text-text p-1.5 rounded-lg hover:bg-surface-2 transition-colors">
                <X size={16} />
              </button>
            </div>

            {inviteErr && (
              <div className="mb-4 text-red-400 text-xs bg-red-500/10 border border-red-500/30 p-2.5 rounded-lg">
                {inviteErr}
              </div>
            )}

            <div className="space-y-4 mb-6 text-xs">
              <div>
                <label className="block font-medium text-muted mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  autoFocus
                  placeholder="colleague@company.com"
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="w-full bg-surface-2 border border-border/60 rounded-lg px-3.5 py-2 text-xs text-text outline-none focus:border-accent transition-colors" 
                />
              </div>

              <div>
                <label className="block font-medium text-muted mb-1.5">Project Role</label>
                <select 
                  value={role} 
                  onChange={e => setRole(e.target.value)} 
                  className="w-full bg-surface-2 border border-border/60 rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-accent transition-colors"
                >
                  <option value="Admin">Admin (Can manage databases)</option>
                  <option value="Member">Member (Read-only access)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-border/30">
              <button onClick={() => setInviteOpen(false)} className="px-4 py-2 text-xs font-medium text-muted hover:text-text hover:bg-surface-2 rounded-lg transition-colors">
                Cancel
              </button>
              <button 
                onClick={() => inviteMut.mutate()} 
                disabled={inviteMut.isPending || !email.includes('@')} 
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-accent text-bg rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                {inviteMut.isPending && <Loader2 size={13} className="animate-spin" />}
                <span>Send Invitation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REMOVE CONFIRMATION */}
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
    </div>
  );
}
