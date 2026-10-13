/**
 * @file src/lib/api/databases.ts
 * @description API service module for managing databases within a project.
 * Implements full database lifecycle operations: create, read, update, delete,
 * lifecycle state changes (start/stop/restart), connection strings, and credential rotation.
 */

import { apiClient } from './client';
import { endpoints } from '@/config/endpoints';

/**
 * Lists all databases belonging to a project.
 * @param projectId - Target project identifier
 */
export async function listDatabases(projectId: string) {
  return apiClient(endpoints.databases.list, {}, { projectId });
}

/**
 * Provisions a new database in the specified project.
 * @param projectId - Target project identifier
 * @param data - Provisioning configuration (name, engine, plan/resources)
 */
export async function createDatabase(projectId: string, data: any) {
  return apiClient(endpoints.databases.create, { body: JSON.stringify(data) }, { projectId });
}

/**
 * Retrieves details and current status for a specific database.
 * @param projectId - Target project identifier
 * @param databaseId - Database identifier
 */
export async function getDatabase(projectId: string, databaseId: string) {
  return apiClient(endpoints.databases.get, {}, { projectId, databaseId });
}

/**
 * Updates configuration (e.g. name or resource allocation) for an existing database.
 * @param projectId - Target project identifier
 * @param databaseId - Database identifier
 * @param data - Updated database properties
 */
export async function updateDatabase(projectId: string, databaseId: string, data: any) {
  return apiClient(endpoints.databases.update, { body: JSON.stringify(data) }, { projectId, databaseId });
}

/**
 * Permanently deletes a database instance.
 * @param projectId - Target project identifier
 * @param databaseId - Database identifier
 */
export async function deleteDatabase(projectId: string, databaseId: string) {
  return apiClient(endpoints.databases.delete, {}, { projectId, databaseId });
}

/**
 * Starts a stopped database instance.
 * @param projectId - Target project identifier
 * @param databaseId - Database identifier
 */
export async function startDatabase(projectId: string, databaseId: string) {
  return apiClient(endpoints.databases.start, {}, { projectId, databaseId });
}

/**
 * Gracefully stops a running database instance.
 * @param projectId - Target project identifier
 * @param databaseId - Database identifier
 */
export async function stopDatabase(projectId: string, databaseId: string) {
  return apiClient(endpoints.databases.stop, {}, { projectId, databaseId });
}

/**
 * Restarts a running database instance.
 * @param projectId - Target project identifier
 * @param databaseId - Database identifier
 */
export async function restartDatabase(projectId: string, databaseId: string) {
  return apiClient(endpoints.databases.restart, {}, { projectId, databaseId });
}

/**
 * Fetches the secure connection uri, host, port, and credentials for a database.
 * @param projectId - Target project identifier
 * @param databaseId - Database identifier
 */
export async function getDatabaseConnection(projectId: string, databaseId: string) {
  return apiClient(endpoints.databases.connection, {}, { projectId, databaseId });
}

/**
 * Rotates database access credentials and generates a new secret.
 * @param projectId - Target project identifier
 * @param databaseId - Database identifier
 */
export async function rotateDatabaseCredentials(projectId: string, databaseId: string) {
  return apiClient(endpoints.databases.rotateCredentials, {}, { projectId, databaseId });
}