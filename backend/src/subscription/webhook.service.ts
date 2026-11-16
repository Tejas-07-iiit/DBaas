import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RazorpayService } from './razorpay.service';
import {
  SubscriptionStatus,
  PaymentStatus,
  WebhookStatus,
  SubscriptionTier,
} from '@prisma/client';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpayService: RazorpayService,
  ) {}

  /**
   * Processes an incoming Razorpay webhook payload.
   * Signature is verified against the raw request body before parsing.
   */
  async handleWebhook(rawBody: string | Buffer, signature: string | undefined): Promise<any> {
    if (!signature) {
      await this.recordAuditLog('WEBHOOK_SIGNATURE_MISSING', null, null, {
        error: 'Missing X-Razorpay-Signature header',
      });
      throw new UnauthorizedException('Missing X-Razorpay-Signature header');
    }

    const isValid = this.razorpayService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      this.logger.warn('Rejected webhook: Invalid Razorpay signature');
      await this.recordAuditLog('WEBHOOK_SIGNATURE_REJECTED', null, null, {
        error: 'Invalid HMAC signature',
      });
      throw new UnauthorizedException('Invalid webhook signature');
    }

    let event: any;
    try {
      const payloadString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf-8') : rawBody;
      event = JSON.parse(payloadString);
    } catch (err: any) {
      throw new BadRequestException('Malformed webhook JSON payload');
    }

    const eventId = event.id || `evt_${event.event}_${Date.now()}`;
    const eventType = event.event;

    this.logger.log(`Received Razorpay webhook: [${eventType}] (Event ID: ${eventId})`);

    // Idempotency check: Look up existing event record
    const existing = await this.prisma.webhookEvent.findUnique({
      where: { providerEventId: eventId },
    });

    if (existing && existing.status === WebhookStatus.PROCESSED) {
      this.logger.log(`Webhook [${eventId}] already processed. Skipping duplicate execution.`);
      return { received: true, idempotentHit: true };
    }

    // Persist event record in PENDING state
    const webhookRecord = existing
      ? existing
      : await this.prisma.webhookEvent.create({
          data: {
            providerEventId: eventId,
            eventType,
            payload: event,
            status: WebhookStatus.PENDING,
          },
        });

    try {
      await this.processEventPayload(eventType, event);

      // Mark webhook as PROCESSED
      await this.prisma.webhookEvent.update({
        where: { id: webhookRecord.id },
        data: {
          status: WebhookStatus.PROCESSED,
          processedAt: new Date(),
        },
      });

      await this.recordAuditLog('WEBHOOK_PROCESSED', null, null, {
        eventId,
        eventType,
      });

      return { received: true, status: 'processed' };
    } catch (err: any) {
      this.logger.error(`Error processing webhook [${eventId}]: ${err.message}`, err.stack);

      await this.prisma.webhookEvent.update({
        where: { id: webhookRecord.id },
        data: {
          status: WebhookStatus.FAILED,
          retryCount: { increment: 1 },
          errorDetails: err.message,
        },
      });

      await this.recordAuditLog('WEBHOOK_PROCESSING_FAILED', null, null, {
        eventId,
        eventType,
        error: err.message,
      });

      throw err;
    }
  }

  private async processEventPayload(eventType: string, event: any): Promise<void> {
    const payload = event.payload;

    switch (eventType) {
      case 'subscription.authenticated':
        await this.handleSubscriptionAuthenticated(payload);
        break;

      case 'subscription.activated':
        await this.handleSubscriptionActivated(payload);
        break;

      case 'subscription.charged':
        await this.handleSubscriptionCharged(payload);
        break;

      case 'subscription.pending':
      case 'subscription.halted':
        await this.handleSubscriptionHalted(payload, eventType);
        break;

      case 'subscription.cancelled':
        await this.handleSubscriptionCancelled(payload);
        break;

      case 'subscription.completed':
        await this.handleSubscriptionCompleted(payload);
        break;

      case 'payment.captured':
        await this.handlePaymentCaptured(payload);
        break;

      case 'payment.failed':
        await this.handlePaymentFailed(payload);
        break;

      default:
        this.logger.log(`Unhandled webhook event type: ${eventType} (Acknowledged)`);
        break;
    }
  }

  private async handleSubscriptionAuthenticated(payload: any): Promise<void> {
    const subEntity = payload?.subscription?.entity;
    if (!subEntity?.id) return;

    const sub = await this.prisma.subscription.findUnique({
      where: { razorpaySubscriptionId: subEntity.id },
    });

    if (!sub) {
      this.logger.warn(`Subscription authenticated for unknown provider ID: ${subEntity.id}`);
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: sub.id },
        data: {
          status: SubscriptionStatus.ACTIVE,
        },
      });

      await tx.subscriptionHistory.create({
        data: {
          subscriptionId: sub.id,
          projectId: sub.projectId,
          action: 'SUBSCRIPTION_AUTHENTICATED',
          fromStatus: sub.status,
          toStatus: SubscriptionStatus.ACTIVE,
          metadata: { providerSubscriptionId: subEntity.id },
        },
      });
    });
  }

  private async handleSubscriptionActivated(payload: any): Promise<void> {
    const subEntity = payload?.subscription?.entity;
    if (!subEntity?.id) return;

    const sub = await this.prisma.subscription.findUnique({
      where: { razorpaySubscriptionId: subEntity.id },
      include: { plan: true },
    });

    if (!sub) return;

    const currentPeriodStart = subEntity.current_start
      ? new Date(subEntity.current_start * 1000)
      : new Date();
    const currentPeriodEnd = subEntity.current_end
      ? new Date(subEntity.current_end * 1000)
      : new Date(Date.now() + 30 * 86400000);
    const nextBillingDate = subEntity.charge_at
      ? new Date(subEntity.charge_at * 1000)
      : currentPeriodEnd;

    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: sub.id },
        data: {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart,
          currentPeriodEnd,
          nextBillingDate,
        },
      });

      await tx.subscriptionHistory.create({
        data: {
          subscriptionId: sub.id,
          projectId: sub.projectId,
          action: 'SUBSCRIPTION_ACTIVATED',
          fromStatus: sub.status,
          toStatus: SubscriptionStatus.ACTIVE,
          metadata: {
            providerSubscriptionId: subEntity.id,
            currentPeriodStart,
            currentPeriodEnd,
          },
        },
      });
    });

    await this.recordAuditLog('SUBSCRIPTION_ACTIVATED', sub.projectId, null, {
      subscriptionId: sub.id,
      tier: sub.tier,
    });
  }

  private async handleSubscriptionCharged(payload: any): Promise<void> {
    const subEntity = payload?.subscription?.entity;
    const paymentEntity = payload?.payment?.entity;
    if (!subEntity?.id) return;

    const sub = await this.prisma.subscription.findUnique({
      where: { razorpaySubscriptionId: subEntity.id },
    });

    if (!sub) return;

    const currentPeriodStart = subEntity.current_start
      ? new Date(subEntity.current_start * 1000)
      : new Date();
    const currentPeriodEnd = subEntity.current_end
      ? new Date(subEntity.current_end * 1000)
      : new Date(Date.now() + 30 * 86400000);
    const nextBillingDate = subEntity.charge_at
      ? new Date(subEntity.charge_at * 1000)
      : currentPeriodEnd;

    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: sub.id },
        data: {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart,
          currentPeriodEnd,
          nextBillingDate,
        },
      });

      if (paymentEntity?.id) {
        // Record payment if not already recorded
        const existingPayment = await tx.payment.findUnique({
          where: { razorpayPaymentId: paymentEntity.id },
        });

        if (!existingPayment) {
          await tx.payment.create({
            data: {
              projectId: sub.projectId,
              subscriptionId: sub.id,
              razorpayPaymentId: paymentEntity.id,
              razorpayOrderId: paymentEntity.order_id || null,
              amount: paymentEntity.amount || 0,
              currency: paymentEntity.currency || 'INR',
              status: PaymentStatus.CAPTURED,
              method: paymentEntity.method || null,
              metadata: paymentEntity,
            },
          });
        }
      }

      await tx.subscriptionHistory.create({
        data: {
          subscriptionId: sub.id,
          projectId: sub.projectId,
          action: 'SUBSCRIPTION_CHARGED',
          fromStatus: sub.status,
          toStatus: SubscriptionStatus.ACTIVE,
          metadata: {
            paymentId: paymentEntity?.id,
            amount: paymentEntity?.amount,
            nextBillingDate,
          },
        },
      });
    });

    await this.recordAuditLog('SUBSCRIPTION_CHARGED', sub.projectId, null, {
      subscriptionId: sub.id,
      paymentId: paymentEntity?.id,
      amount: paymentEntity?.amount,
    });
  }

  private async handleSubscriptionHalted(payload: any, eventType: string): Promise<void> {
    const subEntity = payload?.subscription?.entity;
    if (!subEntity?.id) return;

    const sub = await this.prisma.subscription.findUnique({
      where: { razorpaySubscriptionId: subEntity.id },
    });

    if (!sub) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: sub.id },
        data: {
          status: SubscriptionStatus.PAST_DUE,
        },
      });

      await tx.subscriptionHistory.create({
        data: {
          subscriptionId: sub.id,
          projectId: sub.projectId,
          action: eventType === 'subscription.halted' ? 'SUBSCRIPTION_HALTED' : 'SUBSCRIPTION_PENDING',
          fromStatus: sub.status,
          toStatus: SubscriptionStatus.PAST_DUE,
          metadata: { providerSubscriptionId: subEntity.id },
        },
      });
    });

    await this.recordAuditLog('SUBSCRIPTION_PAST_DUE', sub.projectId, null, {
      subscriptionId: sub.id,
      reason: eventType,
    });
  }

  private async handleSubscriptionCancelled(payload: any): Promise<void> {
    const subEntity = payload?.subscription?.entity;
    if (!subEntity?.id) return;

    const sub = await this.prisma.subscription.findUnique({
      where: { razorpaySubscriptionId: subEntity.id },
    });

    if (!sub) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: sub.id },
        data: {
          status: SubscriptionStatus.CANCELED,
          cancelAtPeriodEnd: false,
          canceledAt: new Date(),
        },
      });

      await tx.subscriptionHistory.create({
        data: {
          subscriptionId: sub.id,
          projectId: sub.projectId,
          action: 'SUBSCRIPTION_CANCELLED_BY_PROVIDER',
          fromStatus: sub.status,
          toStatus: SubscriptionStatus.CANCELED,
          metadata: { providerSubscriptionId: subEntity.id },
        },
      });
    });

    await this.recordAuditLog('SUBSCRIPTION_CANCELLED', sub.projectId, null, {
      subscriptionId: sub.id,
    });
  }

  private async handleSubscriptionCompleted(payload: any): Promise<void> {
    const subEntity = payload?.subscription?.entity;
    if (!subEntity?.id) return;

    const sub = await this.prisma.subscription.findUnique({
      where: { razorpaySubscriptionId: subEntity.id },
    });

    if (!sub) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: sub.id },
        data: {
          status: SubscriptionStatus.CANCELED,
        },
      });

      await tx.subscriptionHistory.create({
        data: {
          subscriptionId: sub.id,
          projectId: sub.projectId,
          action: 'SUBSCRIPTION_COMPLETED',
          fromStatus: sub.status,
          toStatus: SubscriptionStatus.CANCELED,
          metadata: { providerSubscriptionId: subEntity.id },
        },
      });
    });
  }

  private async handlePaymentCaptured(payload: any): Promise<void> {
    const paymentEntity = payload?.payment?.entity;
    if (!paymentEntity?.id) return;

    const existingPayment = await this.prisma.payment.findUnique({
      where: { razorpayPaymentId: paymentEntity.id },
    });

    if (existingPayment) {
      if (existingPayment.status !== PaymentStatus.CAPTURED) {
        await this.prisma.payment.update({
          where: { id: existingPayment.id },
          data: { status: PaymentStatus.CAPTURED },
        });
      }
    }
  }

  private async handlePaymentFailed(payload: any): Promise<void> {
    const paymentEntity = payload?.payment?.entity;
    if (!paymentEntity?.id) return;

    // Check if payment was already recorded
    let payment = await this.prisma.payment.findUnique({
      where: { razorpayPaymentId: paymentEntity.id },
    });

    if (payment) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          errorCode: paymentEntity.error_code || null,
          errorDescription: paymentEntity.error_description || null,
        },
      });
    }

    await this.recordAuditLog('PAYMENT_FAILED', payment?.projectId || null, null, {
      paymentId: paymentEntity.id,
      errorCode: paymentEntity.error_code,
      errorDescription: paymentEntity.error_description,
    });
  }

  private async recordAuditLog(
    action: string,
    projectId: string | null,
    userId: string | null,
    metadata: any,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action,
          resource: 'BILLING',
          projectId,
          userId,
          metadata,
        },
      });
    } catch (err: any) {
      this.logger.warn(`Failed to record audit log: ${err.message}`);
    }
  }
}
