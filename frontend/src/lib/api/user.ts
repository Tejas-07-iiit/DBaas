/**
 * @file src/lib/api/user.ts
 * @description API service module for user account profiles and settings.
 */

import { apiClient } from './client';
import { endpoints } from '@/config/endpoints';

/**
 * Fetches profile details for the currently authenticated user.
 */
export async function getUserProfile() {
  return apiClient(endpoints.user.get);
}

/**
 * Updates profile fields (e.g. display name) for the currently authenticated user.
 * @param data - Updated profile payload
 */
export async function updateUserProfile(data: { name: string }) {
  return apiClient(endpoints.user.update, { body: JSON.stringify(data) });
}

/**
 * Permanently deletes the current user account and cancels associated subscriptions.
 */
export async function deleteAccount() {
  return apiClient(endpoints.user.delete);
}
