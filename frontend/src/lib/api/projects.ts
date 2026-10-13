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
  return apiClient(endpoints.projects.list);
}

/**
 * Creates a new project workspace.
 * @param data - Name and optional description for the project
 */
export async function createProject(data: { name: string; description?: string }) {
  return apiClient(endpoints.projects.create, { body: JSON.stringify(data) });
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
