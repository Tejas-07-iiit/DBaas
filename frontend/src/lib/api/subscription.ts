/**
 * @file src/lib/api/subscription.ts
 * @description API service module for billing, Razorpay subscription lifecycle, and plan tiers.
 */

import { apiClient } from './client';
import { endpoints } from '@/config/endpoints';

export interface VerifyPaymentPayload {
  projectId: string;
  razorpayPaymentId: string;
  razorpaySubscriptionId: string;
  razorpaySignature: string;
}

/**
 * Retrieves the current subscription status, tier details, quotas, and renewal timestamp for the project.
 */
export async function getSubscription(projectId?: string) {
  try {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    const r: any = await apiClient({
      path: `${endpoints.subscription.get.path}${query}`,
      method: 'GET',
    });
    return r.data || r;
  } catch (err: any) {
    return {
      planName: 'Developer Sandbox (Free)',
      tier: 'FREE',
      interval: 'monthly',
      status: 'active',
      isOwner: true,
      renewalDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      limits: {
        maxDatabases: 2,
        maxCpuCores: 4,
        maxRamMb: 4096,
        maxStorageMb: 20480,
      },
      usage: {
        databaseCount: 0,
        cpuUsed: 0,
        ramUsedMb: 0,
        storageUsedMb: 0,
      },
    };
  }
}

/**
 * Retrieves available subscription plans and their limits/pricing tiers.
 */
export async function listPlans() {
  const r: any = await apiClient(endpoints.subscription.listPlans);
  return r.data || r;
}

/**
 * Initiates checkout for upgrading or changing a subscription tier.
 * Returns Razorpay subscription details or free tier transition message.
 */
export async function checkoutPlan(projectId: string, planId: string) {
  const r: any = await apiClient(endpoints.subscription.checkout, {
    body: JSON.stringify({ projectId, planId }),
  });
  return r.data || r;
}

/**
 * Verifies Razorpay checkout cryptographic signature and activates subscription.
 */
export async function verifyPayment(payload: VerifyPaymentPayload) {
  const r: any = await apiClient(endpoints.subscription.verify, {
    body: JSON.stringify(payload),
  });
  return r.data || r;
}

/**
 * Cancels the project's active subscription at period end.
 */
export async function cancelSubscription(projectId: string) {
  const r: any = await apiClient(endpoints.subscription.cancel, {
    body: JSON.stringify({ projectId }),
  });
  return r.data || r;
}

/**
 * Retrieves paginated payment transaction history for the project.
 */
export async function getPaymentHistory(projectId: string, page = 1, limit = 10) {
  try {
    const query = `?projectId=${encodeURIComponent(projectId)}&page=${page}&limit=${limit}`;
    const r: any = await apiClient({
      path: `${endpoints.subscription.payments.path}${query}`,
      method: 'GET',
    });
    return r.data || r;
  } catch {
    return { data: [], pagination: { total: 0, page, limit, totalPages: 0 } };
  }
}
