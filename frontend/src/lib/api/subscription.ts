/**
 * @file src/lib/api/subscription.ts
 * @description API service module for billing, subscription lifecycle, and plan tiers.
 */

import { apiClient } from './client';
import { endpoints } from '@/config/endpoints';

/**
 * Retrieves the current subscription status, tier details, and renewal timestamp for the account.
 */
export async function getSubscription() {
  return apiClient(endpoints.subscription.get);
}

/**
 * Retrieves available subscription plans and their limits/pricing tiers.
 */
export async function listPlans() {
  return apiClient(endpoints.subscription.listPlans);
}

/**
 * Initiates checkout for upgrading or changing a subscription tier.
 * Returns a Stripe checkout URL or confirmation payload.
 * @param planId - Target plan identifier
 */
export async function checkoutPlan(planId: string) {
  return apiClient(endpoints.subscription.checkout, { body: JSON.stringify({ planId }) });
}

/**
 * Cancels the user's active subscription at period end.
 */
export async function cancelSubscription() {
  return apiClient(endpoints.subscription.cancel);
}
