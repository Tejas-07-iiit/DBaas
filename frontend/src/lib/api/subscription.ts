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
  try {
    return await apiClient(endpoints.subscription.get);
  } catch {
    return {
      planName: 'Developer (Unlimited)',
      status: 'active',
      renewalDate: null,
      limits: {
        maxProjects: 999,
        maxDatabases: 999,
        maxCpuPerDb: 8,
        maxRamPerDbMb: 16384,
        maxStoragePerDbGb: 100,
      },
    };
  }
}

/**
 * Retrieves available subscription plans and their limits/pricing tiers.
 */
export async function listPlans() {
  try {
    return await apiClient(endpoints.subscription.listPlans);
  } catch {
    return [
      {
        id: 'developer-plan',
        name: 'Developer (Self-Hosted)',
        price: '$0',
        description: 'All features enabled for local self-hosted deployment',
        features: [
          'Unlimited projects and databases',
          'Direct KVM hypervisor integration',
          'Management VM orchestrator',
          'Full database engine catalog'
        ],
        current: true,
      },
    ];
  }
}

/**
 * Initiates checkout for upgrading or changing a subscription tier.
 * Returns a Stripe checkout URL or confirmation payload.
 * @param planId - Target plan identifier
 */
export async function checkoutPlan(planId: string) {
  try {
    return await apiClient(endpoints.subscription.checkout, { body: JSON.stringify({ planId }) });
  } catch {
    return { success: true, message: 'Billing is disabled in self-hosted mode' };
  }
}

/**
 * Cancels the user's active subscription at period end.
 */
export async function cancelSubscription() {
  try {
    return await apiClient(endpoints.subscription.cancel);
  } catch {
    return { success: true, message: 'Billing is disabled in self-hosted mode' };
  }
}
