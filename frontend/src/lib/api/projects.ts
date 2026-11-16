/**
 * @file src/lib/api/projects.ts
 * @description API service module for project workspaces.
 * Supports listing user projects, creating new projects, fetching details,
 * updating project metadata, and deleting projects.
 */

import { apiClient } from './client';
import { buildPath } from './buildPath';
import { endpoints } from '@/config/endpoints';

/**
 * Retrieves the list of all projects accessible by the authenticated user.
 */
export async function listProjects() {
  const res: any = await apiClient(endpoints.projects.list);
  return Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
}

/**
 * Creates a new project workspace.
 * @param data - Name, optional description, and hardware resource specs for the dedicated Project VM
 */
export async function createProject(data: {
  name: string;
  description?: string;
  cpuCores?: number;
  ramMb?: number;
  storageMb?: number;
}) {
  return apiClient(endpoints.projects.create, { body: JSON.stringify(data) });
}

/**
 * Starts the project host VM.
 */
export async function startProjectVm(projectId: string) {
  const endpoint = { ...endpoints.projects.startVm, path: buildPath(endpoints.projects.startVm.path, { projectId }) };
  return apiClient(endpoint);
}

/**
 * Powers down the project host VM to conserve resources.
 */
export async function stopProjectVm(projectId: string) {
  const endpoint = { ...endpoints.projects.stopVm, path: buildPath(endpoints.projects.stopVm.path, { projectId }) };
  return apiClient(endpoint);
}

/**
 * Restarts the project host VM.
 */
export async function restartProjectVm(projectId: string) {
  const endpoint = { ...endpoints.projects.restartVm, path: buildPath(endpoints.projects.restartVm.path, { projectId }) };
  return apiClient(endpoint);
}

/**
 * Gets real-time VM status and metrics for the project host.
 */
export async function getProjectVmStatus(projectId: string) {
  const endpoint = { ...endpoints.projects.vmStatus, path: buildPath(endpoints.projects.vmStatus.path, { projectId }) };
  return apiClient(endpoint);
}

/**
 * Fetches details and metadata for a specific project.
 * @param projectId - Target project identifier
 */
export async function getProject(projectId: string) {
  const endpoint = { ...endpoints.projects.get, path: buildPath(endpoints.projects.get.path, { projectId }) };
  return apiClient(endpoint);
}

/**
 * Updates project name or description. Requires Admin or Owner role in the project.
 * @param projectId - Target project identifier
 * @param data - Updated project fields
 */
export async function updateProject(projectId: string, data: { name: string; description?: string }) {
  const endpoint = { ...endpoints.projects.update, path: buildPath(endpoints.projects.update.path, { projectId }) };
  return apiClient(endpoint, { body: JSON.stringify(data) });
}

/**
 * Permanently deletes a project and all associated resources. Requires Owner role.
 * @param projectId - Target project identifier
 */
export async function deleteProject(projectId: string) {
  const endpoint = { ...endpoints.projects.delete, path: buildPath(endpoints.projects.delete.path, { projectId }) };
  return apiClient(endpoint);
}
