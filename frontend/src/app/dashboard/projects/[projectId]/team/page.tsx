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
import { Users, Plus, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";

export default function TeamPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Member");
  const [inviteErr, setInviteErr] = useState("");
  
  const [removeId, setRemoveId] = useState("");

  const projQuery = useQuery({ queryKey: ["project", projectId], queryFn: async () => { const r: any = await getProject(projectId); return mapProject(r.data || r); } });
  const memQuery = useQuery({ queryKey: ["members", projectId], queryFn: async () => { const r: any = await listMembers(projectId); return r.data || r; } });

  const isOwnerAdmin = projQuery.data?.role === 'Owner' || projQuery.data?.role === 'Admin';
  const ownerCount = memQuery.data?.filter((m: any) => m.role === 'Owner').length || 0;

  const inviteMut = useMutation({
    mutationFn: () => addMember(projectId, { email, role }),
    onSuccess: () => { alert("Invited"); queryClient.invalidateQueries({ queryKey: ["members", projectId] }); setInviteOpen(false); setEmail(""); setRole("Member"); },
    onError: (err: any) => setInviteErr(err.body?.message || "Failed to invite")
  });

  const roleMut = useMutation({
    mutationFn: (args: {id: string, r: string}) => updateMemberRole(projectId, args.id, args.r),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["members", projectId] }); },
    onError: (err: any) => alert(err.body?.message || "Failed to change role")
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => removeMember(projectId, id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["members", projectId] }); setRemoveId(""); },
    onError: (err: any) => alert(err.body?.message || "Failed to remove")
  });

  if (projQuery.isLoading) return <div>Loading...</div>;
  if (projQuery.error) return <ErrorState error={projQuery.error} />;

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Users size={24}/> Team</h1>
        <button disabled={!isOwnerAdmin} onClick={() => setInviteOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-text text-bg rounded font-bold text-sm disabled:opacity-50" title={!isOwnerAdmin ? "Only Owners and Admins can invite" : ""}><Plus size={16}/> Invite member</button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 bg-surface/30 border border-border/50 rounded-xl overflow-hidden">
          {memQuery.isLoading ? <div className="p-8 text-center text-muted">Loading team...</div> : memQuery.error ? <ErrorState error={memQuery.error} /> : (
            <table className="w-full text-sm text-left">
              <thead className="bg-surface-2 text-muted uppercase text-[10px] font-bold tracking-widest">
                <tr>
                  <th className="px-6 py-3">Member</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Joined</th>
                  {isOwnerAdmin && <th className="px-6 py-3 w-16"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {memQuery.data.map((m: any) => (
                  <tr key={m.id} className="hover:bg-surface-2/50">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-2 border border-border/50 flex items-center justify-center font-bold text-xs">{m.name.substring(0, 2).toUpperCase()}</div>
                      <div><div className="font-bold">{m.name}</div><div className="text-xs text-muted">{m.email}</div></div>
                    </td>
                    <td className="px-6 py-4">
                      {isOwnerAdmin ? (
                        <select 
                          value={m.role} 
                          onChange={e => roleMut.mutate({ id: m.id, r: e.target.value })}
                          disabled={roleMut.isPending || (m.role === 'Owner' && ownerCount <= 1)}
                          className="bg-transparent border border-border/50 rounded px-2 py-1 outline-none text-xs disabled:opacity-50"
                        >
                          <option value="Owner">Owner</option>
                          <option value="Admin">Admin</option>
                          <option value="Member">Member</option>
                        </select>
                      ) : <RoleBadge role={m.role} />}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted">{new Date(m.joinedAt).toLocaleDateString()}</td>
                    {isOwnerAdmin && (
                      <td className="px-6 py-4 text-right">
                        <button disabled={m.role === 'Owner' && ownerCount <= 1} onClick={() => setRemoveId(m.id)} className="p-1 text-red-400 hover:bg-surface-2 rounded disabled:opacity-30" title={m.role === 'Owner' && ownerCount <= 1 ? "Cannot remove last owner" : ""}><Trash2 size={16}/></button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="bg-surface/30 border border-border/50 rounded-xl p-6 h-max">
           <h3 className="font-bold mb-4">What each role can do</h3>
           <div className="space-y-4 text-sm">
             <div><span className="font-bold text-accent">Owner</span><p className="text-muted text-xs mt-1">Full access including project deletion and billing.</p></div>
             <div><span className="font-bold">Admin</span><p className="text-muted text-xs mt-1">Manage databases and team members, but cannot delete project or change owners.</p></div>
             <div><span className="font-bold">Member</span><p className="text-muted text-xs mt-1">View databases, metrics, logs, and events. Cannot make changes.</p></div>
           </div>
        </div>
      </div>

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4" onClick={() => setInviteOpen(false)}>
           <div className="bg-surface border border-border/50 p-6 rounded-xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">Invite member</h2>
              {inviteErr && <div className="mb-4 text-red-400 text-sm bg-red-500/10 p-2 rounded">{inviteErr}</div>}
              <div className="space-y-4 mb-6">
                <div><label className="block text-sm font-bold mb-1">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm outline-none focus:border-accent" /></div>
                <div>
                  <label className="block text-sm font-bold mb-1">Role</label>
                  <select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm outline-none">
                    <option value="Admin">Admin</option>
                    <option value="Member">Member</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                 <button onClick={() => setInviteOpen(false)} className="px-4 py-2 font-bold text-sm text-muted">Cancel</button>
                 <button onClick={() => inviteMut.mutate()} disabled={inviteMut.isPending || !email.includes('@')} className="px-4 py-2 font-bold text-sm bg-text text-bg rounded disabled:opacity-50">Invite</button>
              </div>
           </div>
        </div>
      )}

      <ConfirmDialog isOpen={!!removeId} onClose={() => setRemoveId("")} title="Remove member" message="They will immediately lose access to this project." confirmText="Remove" danger onConfirm={() => removeMut.mutate(removeId)} />
    </div>
  );
}