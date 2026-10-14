/**
 * @file src/lib/api/databases.ts
 * @description API service module for managing databases within a project.
 * Implements full database lifecycle operations: create, read, update, delete,
 * lifecycle state changes (start/stop/restart), connection strings, and credential rotation.
 */

import { apiClient } from './client';
import { endpoints } from '@/config/endpoints';
import { mapDatabase } from './mappers';

/**
 * Lists all databases belonging to a project.
 * @param projectId - Target project identifier
 */
export async function listDatabases(projectId: string) {
  const res: any = await apiClient(endpoints.databases.list, {}, { projectId });
  const raw = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
  return raw.map(mapDatabase);
}

/**
 * Provisions a new database in the specified project.
 * @param projectId - Target project identifier
 * @param data - Provisioning configuration (name, engine, plan/resources)
 */
export async function createDatabase(projectId: string, data: any) {
  const payload = {
    name: data.name,
    type: (data.type || data.engine || 'POSTGRESQL').toUpperCase(),
    cpuCores: Number(data.cpuCores || data.cpu) || 1,
    ramMb: Number(data.ramMb || data.memoryMb) || 1024,
    storageMb: data.storageMb ? Number(data.storageMb) : (data.storageGb ? Number(data.storageGb) * 1024 : 5120),
    ...(data.version ? { version: data.version } : {})
  };
  return apiClient(endpoints.databases.create, { body: JSON.stringify(payload) }, { projectId });
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
  const res: any = await apiClient(endpoints.databases.connection, {}, { projectId, databaseId });
  const data = res?.data || res || {};
  return {
    ...data,
    endpoint: data.connectionUri || (data.host ? `${data.host}:${data.port}` : ''),
    secretReference: data.password || '********',
  };
}

/**
 * Rotates database access credentials and generates a new secret.
 * @param projectId - Target project identifier
 * @param databaseId - Database identifier
 */
export async function rotateDatabaseCredentials(projectId: string, databaseId: string) {
  return apiClient(endpoints.databases.rotateCredentials, {}, { projectId, databaseId });
}

/**
 * Retrieves database and collection structure with document counts (Atlas-style Data Explorer).
 */
export async function getExplorerOverview(projectId: string, databaseId: string) {
  const res: any = await apiClient(endpoints.databases.explorer, {}, { projectId, databaseId });
  return res?.data || res;
}

/**
 * Retrieves documents from a specific collection with filtering.
 */
export async function getCollectionDocuments(
  projectId: string,
  databaseId: string,
  params: { db?: string; collection?: string; limit?: number; skip?: number; search?: string }
) {
  const query = new URLSearchParams();
  if (params.db) query.set('db', params.db);
  if (params.collection) query.set('collection', params.collection);
  if (params.limit) query.set('limit', String(params.limit));
  if (params.skip) query.set('skip', String(params.skip));
  if (params.search) query.set('search', params.search);
  const qs = query.toString() ? `?${query.toString()}` : '';
  const res: any = await apiClient(
    { path: `${endpoints.databases.documents.path}${qs}`, method: 'GET' },
    {},
    { projectId, databaseId }
  );
  return res?.data || res;
}

/**
 * Inserts a document into a collection.
 */
export async function insertCollectionDocument(
  projectId: string,
  databaseId: string,
  payload: { db: string; collection: string; document: any }
) {
  const res: any = await apiClient(
    endpoints.databases.insertDocument,
    { body: JSON.stringify(payload) },
    { projectId, databaseId }
  );
  return res?.data || res;
}

/**
 * Retrieves database access users and assigned roles (Atlas-style Database Users).
 */
export async function getDatabaseUsers(projectId: string, databaseId: string) {
  const res: any = await apiClient(endpoints.databases.databaseUsers, {}, { projectId, databaseId });
  return res?.data || res;
}