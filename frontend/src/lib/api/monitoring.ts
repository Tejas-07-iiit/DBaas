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
export async function getLogs(projectId: string, databaseId: string, search: string, level: string) {
  return apiClient(endpoints.monitoring.logs, {}, { projectId, databaseId, search, level });
}

/**
 * Fetches audit log events and state transitions for a project or specific database.
 * @param projectId - Target project identifier
 * @param databaseId - Optional database instance identifier
 */
export async function getEvents(projectId: string, databaseId?: string) {
  return apiClient(endpoints.monitoring.events, {}, { projectId, databaseId: databaseId || '' });
}
