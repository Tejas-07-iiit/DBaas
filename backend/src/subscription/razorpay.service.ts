import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';

export interface CreatePlanParams {
  name: string;
  amount: number; // in paise
  currency?: string;
  period: 'monthly' | 'yearly';
  interval?: number;
  description?: string;
}

export interface CreateSubscriptionParams {
  planId: string;
  totalCount?: number;
  customerNotify?: 0 | 1;
  notes?: Record<string, string>;
}

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private client: Razorpay | null = null;
  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;
  private readonly mode: string;

  constructor(private readonly config: ConfigService) {
    this.keyId = this.config.get<string>('razorpay.keyId') || process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key_id';
    this.keySecret = this.config.get<string>('razorpay.keySecret') || process.env.RAZORPAY_KEY_SECRET || 'rzp_test_mock_key_secret';
    this.webhookSecret = this.config.get<string>('razorpay.webhookSecret') || process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_test_webhook_secret';
    this.mode = this.config.get<string>('razorpay.mode') || process.env.RAZORPAY_MODE || 'test';

    try {
      this.client = new Razorpay({
        key_id: this.keyId,
        key_secret: this.keySecret,
      });
      this.logger.log(`Razorpay SDK initialized in [${this.mode.toUpperCase()}] mode (Key: ${this.keyId.substring(0, 8)}...)`);
    } catch (err: any) {
      this.logger.warn(`Razorpay client init error: ${err.message}. Using fallback mock operations for tests.`);
      this.client = null;
    }
  }

  getKeyId(): string {
    return this.keyId;
  }

  isTestMode(): boolean {
    return this.mode === 'test';
  }

  /**
   * Creates a recurring subscription plan in Razorpay.
   */
  async createPlan(params: CreatePlanParams): Promise<{ id: string }> {
    if (this.client && !this.keyId.includes('mock')) {
      try {
        const plan = await this.client.plans.create({
          period: params.period === 'monthly' ? 'monthly' : 'yearly',
          interval: params.interval || 1,
          item: {
            name: params.name,
            amount: params.amount,
            currency: params.currency || 'INR',
            description: params.description || '',
          },
        });
        return { id: plan.id };
      } catch (err: any) {
        this.logger.error(`Failed to create Razorpay plan: ${err.message}`);
        throw err;
      }
    }

    // Deterministic mock plan ID for development / testing
    const mockId = `plan_test_${params.period}_${params.amount}`;
    this.logger.log(`[Mock Razorpay] Generated Plan ID: ${mockId}`);
    return { id: mockId };
  }

  /**
   * Creates a recurring subscription server-side in Razorpay.
   */
  async createSubscription(params: CreateSubscriptionParams): Promise<{ id: string; status: string }> {
    if (this.client && !this.keyId.includes('mock')) {
      try {
        const sub = await (this.client.subscriptions as any).create({
          plan_id: params.planId,
          total_count: params.totalCount || 120, // 10 years default
          customer_notify: params.customerNotify !== undefined ? params.customerNotify : 1,
          notes: params.notes || {},
        });
        return { id: sub.id, status: sub.status };
      } catch (err: any) {
        this.logger.error(`Failed to create Razorpay subscription: ${err.message}`);
        throw err;
      }
    }

    // Mock subscription for local test mode
    const mockSubId = `sub_${crypto.randomBytes(8).toString('hex')}`;
    this.logger.log(`[Mock Razorpay] Generated Subscription ID: ${mockSubId} for plan: ${params.planId}`);
    return { id: mockSubId, status: 'created' };
  }

  /**
   * Cancels a subscription in Razorpay.
   */
  async cancelSubscription(providerSubscriptionId: string, cancelAtCycleEnd = false): Promise<any> {
    if (this.client && !this.keyId.includes('mock')) {
      try {
        return await (this.client.subscriptions as any).cancel(providerSubscriptionId, cancelAtCycleEnd);
      } catch (err: any) {
        this.logger.error(`Failed to cancel Razorpay subscription: ${err.message}`);
        throw err;
      }
    }

    this.logger.log(`[Mock Razorpay] Cancelled subscription ${providerSubscriptionId} (at cycle end: ${cancelAtCycleEnd})`);
    return { id: providerSubscriptionId, status: 'cancelled' };
  }

  /**
   * Fetches subscription details from Razorpay.
   */
  async fetchSubscription(providerSubscriptionId: string): Promise<any> {
    if (this.client && !this.keyId.includes('mock')) {
      try {
        return await (this.client.subscriptions as any).fetch(providerSubscriptionId);
      } catch (err: any) {
        this.logger.error(`Failed to fetch Razorpay subscription: ${err.message}`);
        throw err;
      }
    }

    return {
      id: providerSubscriptionId,
      status: 'active',
      current_start: Math.floor(Date.now() / 1000),
      current_end: Math.floor(Date.now() / 1000) + 30 * 86400,
    };
  }

  /**
   * Fetches payment details from Razorpay.
   */
  async fetchPayment(paymentId: string): Promise<any> {
    if (this.client && !this.keyId.includes('mock')) {
      try {
        return await this.client.payments.fetch(paymentId);
      } catch (err: any) {
        this.logger.error(`Failed to fetch Razorpay payment: ${err.message}`);
        throw err;
      }
    }

    return {
      id: paymentId,
      status: 'captured',
      method: 'card',
      amount: 199900,
      currency: 'INR',
    };
  }

  /**
   * Verifies Razorpay checkout payment signature for a subscription:
   * Signature = HMAC-SHA256(payment_id + '|' + subscription_id, key_secret)
   */
  verifyPaymentSignature(params: {
    razorpayPaymentId: string;
    razorpaySubscriptionId: string;
    razorpaySignature: string;
  }): boolean {
    if (!params.razorpayPaymentId || !params.razorpaySubscriptionId || !params.razorpaySignature) {
      return false;
    }

    const payload = `${params.razorpayPaymentId}|${params.razorpaySubscriptionId}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(payload)
      .digest('hex');

    if (expectedSignature.length !== params.razorpaySignature.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(params.razorpaySignature, 'utf-8'),
    );
  }

  /**
   * Verifies Razorpay Webhook signature:
   * Signature = HMAC-SHA256(rawRequestBody, webhookSecret)
   */
  verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
    if (!rawBody || !signature) {
      return false;
    }

    const payload = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf-8');
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    if (expectedSignature.length !== signature.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(signature, 'utf-8'),
    );
  }

  /**
   * Helper to generate a valid webhook signature (for test suites).
   */
  generateTestWebhookSignature(payload: string | Buffer): string {
    const raw = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf-8');
    return crypto.createHmac('sha256', this.webhookSecret).update(raw).digest('hex');
  }

  /**
   * Helper to generate a valid checkout signature (for test suites).
   */
  generateTestPaymentSignature(paymentId: string, subscriptionId: string): string {
    const payload = `${paymentId}|${subscriptionId}`;
    return crypto.createHmac('sha256', this.keySecret).update(payload).digest('hex');
  }
}
