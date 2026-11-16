/**
 * @file src/lib/api/invitations.ts
 * @description API client functions for project email invitations and onboarding.
 */

import { apiClient } from './client';
import { endpoints } from '@/config/endpoints';

export interface ProjectInvitation {
  id: string;
  projectId: string;
  projectName?: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  createdAt: string;
  isExpired?: boolean;
  isValid?: boolean;
  invitedBy?: {
    id?: string;
    name?: string | null;
    email?: string;
  };
}

/**
 * Lists all pending invitations for a given project.
 */
export async function listInvitations(projectId: string): Promise<ProjectInvitation[]> {
  const res: any = await apiClient(endpoints.members.invitations, {}, { projectId });
  return Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
}

/**
 * Sends a new email invitation to join a project workspace.
 */
export async function createInvitation(
  projectId: string,
  data: { email: string; role: string },
): Promise<ProjectInvitation> {
  const payload = {
    email: data.email.trim().toLowerCase(),
    role: data.role ? String(data.role).toUpperCase() : 'MEMBER',
  };
  const res: any = await apiClient(
    endpoints.members.createInvitation,
    { body: JSON.stringify(payload) },
    { projectId },
  );
  return res.data || res;
}

/**
 * Revokes a pending invitation.
 */
export async function revokeInvitation(projectId: string, invitationId: string): Promise<void> {
  await apiClient(
    endpoints.members.revokeInvitation,
    {},
    { projectId, invitationId },
  );
}

/**
 * Resends an invitation email with a refreshed token and extended expiration.
 */
export async function resendInvitation(
  projectId: string,
  invitationId: string,
): Promise<{ id: string; status: string; expiresAt: string; resent: boolean }> {
  const res: any = await apiClient(
    endpoints.members.resendInvitation,
    {},
    { projectId, invitationId },
  );
  return res.data || res;
}

/**
 * Fetches public invitation details using an invitation token.
 */
export async function getInvitation(token: string): Promise<ProjectInvitation> {
  const res: any = await apiClient(endpoints.invitations.get, {}, { token });
  return res.data || res;
}

/**
 * Accepts an invitation and joins the project.
 */
export async function acceptInvitation(
  token: string,
): Promise<{ success: boolean; projectId: string; projectName: string; role: string }> {
  const res: any = await apiClient(endpoints.invitations.accept, {}, { token });
  return res.data || res;
}

export interface MyPendingInvitation {
  id: string;
  token: string;
  projectId: string;
  projectName: string;
  projectOwner?: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  status: string;
  expiresAt: string;
  createdAt: string;
  invitedBy?: {
    id: string;
    name?: string | null;
    email?: string;
  };
}

/**
 * Lists all pending invitations addressed to the currently authenticated user's email.
 */
export async function getMyPendingInvitations(): Promise<MyPendingInvitation[]> {
  const res: any = await apiClient(endpoints.invitations.myPending, {});
  return Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
}

/**
 * Declines an invitation sent to the authenticated user's email.
 */
export async function declineInvitation(
  token: string,
): Promise<{ success: boolean; message: string }> {
  const res: any = await apiClient(endpoints.invitations.decline, {}, { token });
  return res.data || res;
}

