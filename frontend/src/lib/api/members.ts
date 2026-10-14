/**
 * @file src/lib/api/members.ts
 * @description API service module for project team member management and role-based access control (RBAC).
 */

import { apiClient } from './client';
import { endpoints } from '@/config/endpoints';

/**
 * Lists all collaborators assigned to a given project along with their membership roles.
 * @param projectId - Target project identifier
 */
export async function listMembers(projectId: string) {
  const res: any = await apiClient(endpoints.members.list, {}, { projectId });
  return Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
}

/**
 * Invites or adds a new user to the project with an assigned role.
 * @param projectId - Target project identifier
 * @param data - Member details including email and role ('Owner' | 'Admin' | 'Member')
 */
export async function addMember(projectId: string, data: any) {
  return apiClient(endpoints.members.add, { body: JSON.stringify(data) }, { projectId });
}

/**
 * Updates a member's role within the project. Requires Admin or Owner privileges.
 * @param projectId - Target project identifier
 * @param memberId - Target member identifier
 * @param role - New assigned role ('Admin' | 'Member')
 */
export async function updateMemberRole(projectId: string, memberId: string, role: string) {
  return apiClient(endpoints.members.updateRole, { body: JSON.stringify({ role }) }, { projectId, userId: memberId, memberId });
}

/**
 * Removes a member from the project. Requires Admin or Owner privileges.
 * @param projectId - Target project identifier
 * @param memberId - Target member identifier to remove
 */
export async function removeMember(projectId: string, memberId: string) {
  return apiClient(endpoints.members.remove, {}, { projectId, userId: memberId, memberId });
}
