/**
 * @file src/lib/api/monitoring.ts
 * @description API service module for database telemetry, metrics, logs, and audit events.
 */

import { apiClient } from './client';
import { endpoints } from '@/config/endpoints';

/**
 * Fetches resource utilization metrics (CPU, RAM, Disk I/O) over a specified time window.
 * @param projectId - Target project identifier
 * @param databaseId - Database instance identifier
 * @param range - Time range filter (e.g., '1h', '24h', '7d')
 */
export async function getMetrics(projectId: string, databaseId: string, range: string) {
  return apiClient(endpoints.monitoring.metrics, {}, { projectId, databaseId, range });
}

/**
 * Queries runtime log entries with optional text search and severity level filtering.
 * @param projectId - Target project identifier
 * @param databaseId - Database instance identifier
 * @param search - Search term filter
 * @param level - Log severity level filter (e.g. 'all', 'error', 'info')
 */
export async function getLogs(projectId: string, databaseId: string, search?: string, level?: string) {
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  if (level && level !== 'all') query.set('level', level);
  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiClient(
    { path: `${endpoints.monitoring.logs.path}${qs}`, method: 'GET' },
    {},
    { projectId, databaseId }
  );
}

/**
 * Fetches audit log events and state transitions for a project or specific database.
 * @param projectId - Target project identifier
 * @param databaseId - Optional database instance identifier
 * @param options - Pagination options
 */
export async function getEvents(
  projectId: string, 
  databaseId?: string,
  options?: { page?: number; limit?: number }
) {
  const query = new URLSearchParams();
  if (options?.page) query.set('page', String(options.page));
  if (options?.limit) query.set('limit', String(options.limit));
  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiClient(
    { path: `${endpoints.monitoring.events.path}${qs}`, method: 'GET' },
    {},
    { projectId, databaseId: databaseId || '' }
  );
}
