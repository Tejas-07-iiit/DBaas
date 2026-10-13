/**
 * @file src/lib/api/admin.ts
 * @description API service module for Platform Admin operations.
 * Allows global platform administrators to monitor platform-wide users,
 * projects, database clusters, and system health status.
 */

import { apiClient } from './client';
import { endpoints } from '@/config/endpoints';

/**
 * Lists all registered users platform-wide with pagination.
 * @param page - Page number (1-based)
 * @param limit - Number of records per page
 */
export async function getAdminUsers(page: number, limit: number) {
  return apiClient(endpoints.admin.users, {}, { page, limit });
}

/**
 * Lists all active projects platform-wide with pagination.
 * @param page - Page number (1-based)
 * @param limit - Number of records per page
 */
export async function getAdminProjects(page: number, limit: number) {
  return apiClient(endpoints.admin.projects, {}, { page, limit });
}

/**
 * Lists all database instances platform-wide with pagination.
 * @param page - Page number (1-based)
 * @param limit - Number of records per page
 */
export async function getAdminDatabases(page: number, limit: number) {
  return apiClient(endpoints.admin.databases, {}, { page, limit });
}

/**
 * Fetches overall platform infrastructure and service health metrics.
 */
export async function getAdminHealth() {
  return apiClient(endpoints.admin.systemHealth);
}
