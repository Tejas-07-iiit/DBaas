import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ProjectAuthorizationService } from '../projects/project-authorization.service';
import { RazorpayService } from './razorpay.service';
import { FirebaseUser } from '../auth/interfaces/firebase-user.interface';
import {
  SubscriptionTier,
  SubscriptionStatus,
  ProjectRole,
  PaymentStatus,
  DatabaseStatus,
  BillingInterval,
} from '@prisma/client';
import {
  CheckoutSubscriptionDto,
  VerifyPaymentDto,
  CancelSubscriptionDto,
  PaymentHistoryQueryDto,
} from './dto/billing.dto';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly projectAuth: ProjectAuthorizationService,
    private readonly razorpayService: RazorpayService,
    private readonly configService?: ConfigService,
  ) {}

  /**
   * Returns whether payments are required or disabled globally via PAYMENT_ENABLED.
   */
  isPaymentEnabled(): boolean {
    if (!this.configService) {
      return true;
    }
    const enabled = this.configService.get<any>('paymentEnabled');
    if (enabled === false || enabled === 'false' || enabled === '0' || enabled === 'disabled') {
      return false;
    }
    return true;
  }

  /**
   * Returns active subscription plans from PostgreSQL.
   */
  async listPlans() {
    const plans = await this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: [{ amount: 'asc' }, { interval: 'asc' }],
    });

    return plans.map((p) => ({
      id: p.id,
      name: p.name,
      tier: p.tier,
      interval: p.interval.toLowerCase(),
      amount: p.amount,
      price: (p.amount / 100).toFixed(0),
      currency: p.currency,
      description: p.description,
      features: p.features,
      limits: {
        maxDatabases: p.maxDatabases,
        maxCpuCores: p.maxCpuCores,
        maxRamMb: p.maxRamMb,
        maxStorageMb: p.maxStorageMb,
      },
    }));
  }

  /**
   * Retrieves subscription details for a project, enforcing project authorization.
   */
  async getSubscription(firebaseUser: FirebaseUser, projectId?: string) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);

    let project: any;

    if (projectId) {
      // Authorize project membership (tenant isolation: throws 404 if not a member)
      const authCtx = await this.projectAuth.authorize(projectId, user.id);
      project = authCtx.project;
    } else {
      // Fallback: primary owned project or first member project
      project = await this.prisma.project.findFirst({
        where: { ownerId: user.id },
        include: { subscription: true },
        orderBy: { createdAt: 'asc' },
      });

      if (!project) {
        const member = await this.prisma.projectMember.findFirst({
          where: { userId: user.id },
          include: { project: { include: { subscription: true } } },
        });
        project = member?.project || null;
      }

      if (!project) {
        project = await this.prisma.project.create({
          data: {
            name: `${user.name || 'Personal'} Workspace`,
            ownerId: user.id,
            description: 'Default project workspace',
          },
          include: { subscription: true },
        });
      }
    }

    // Auto-provision default Free subscription if none exists
    let sub = await this.prisma.subscription.findUnique({
      where: { projectId: project.id },
      include: { plan: true },
    });

    if (!sub) {
      const freePlan = await this.prisma.plan.findFirst({
        where: { tier: SubscriptionTier.FREE, interval: BillingInterval.MONTHLY },
      });

      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 30);

      sub = await this.prisma.subscription.create({
        data: {
          projectId: project.id,
          tier: SubscriptionTier.FREE,
          status: SubscriptionStatus.ACTIVE,
          planId: freePlan?.id || null,
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
        },
        include: { plan: true },
      });
    }

    // Determine if current user is Project OWNER
    const membership = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId: project.id,
        },
      },
    });

    const isOwner = project.ownerId === user.id || membership?.role === ProjectRole.OWNER;

    // Calculate current resource consumption
    const activeFilter = {
      projectId: project.id,
      status: { notIn: [DatabaseStatus.DELETED] },
    };

    const [dbCount, usageAgg] = await Promise.all([
      this.prisma.databaseInstance.count({ where: activeFilter }),
      this.prisma.databaseInstance.aggregate({
        where: activeFilter,
        _sum: {
          cpuCores: true,
          ramMb: true,
          storageMb: true,
        },
      }),
    ]);

    const usage = {
      databaseCount: dbCount,
      cpuUsed: usageAgg._sum.cpuCores || 0,
      ramUsedMb: usageAgg._sum.ramMb || 0,
      storageUsedMb: usageAgg._sum.storageMb || 0,
    };

    // Load active plan limits
    const plan = sub.plan || (await this.prisma.plan.findFirst({
      where: { tier: sub.tier, interval: BillingInterval.MONTHLY },
    }));

    const limits = plan
      ? {
          maxDatabases: plan.maxDatabases,
          maxCpuCores: plan.maxCpuCores,
          maxRamMb: plan.maxRamMb,
          maxStorageMb: plan.maxStorageMb,
        }
      : {
          maxDatabases: 2,
          maxCpuCores: 4,
          maxRamMb: 4096,
          maxStorageMb: 20480,
        };

    return {
      id: sub.id,
      projectId: project.id,
      planId: plan?.id || null,
      planName: plan?.name || `${sub.tier} Plan`,
      tier: sub.tier,
      interval: plan?.interval ? plan.interval.toLowerCase() : 'monthly',
      status: sub.status.toLowerCase(),
      paymentEnabled: this.isPaymentEnabled(),
      renewalDate: sub.currentPeriodEnd
        ? sub.currentPeriodEnd.toISOString()
        : new Date(Date.now() + 30 * 86400000).toISOString(),
      nextBillingDate: sub.nextBillingDate?.toISOString() || null,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      isOwner,
      limits,
      usage,
      ...(isOwner && sub.razorpaySubscriptionId
        ? { razorpaySubscriptionId: sub.razorpaySubscriptionId }
        : {}),
    };
  }

  /**
   * Initiates subscription checkout. Only Project OWNER can invoke this.
   */
  async checkoutPlan(firebaseUser: FirebaseUser, dto: CheckoutSubscriptionDto) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);

    // Enforce Project OWNER permission
    await this.projectAuth.authorize(dto.projectId, user.id, [ProjectRole.OWNER]);

    // Find requested Plan
    let plan = await this.prisma.plan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan) {
      plan = await this.prisma.plan.findFirst({
        where: {
          OR: [
            { id: dto.planId },
            { name: { contains: dto.planId, mode: 'insensitive' } },
          ],
        },
      });
    }

    if (!plan || !plan.isActive) {
      throw new BadRequestException(`Unknown or inactive subscription plan '${dto.planId}'`);
    }

    const currentSub = await this.prisma.subscription.findUnique({
      where: { projectId: dto.projectId },
    });

    const paymentEnabled = this.isPaymentEnabled();

    // If payments are disabled globally OR requested plan is FREE, apply change directly
    if (!paymentEnabled || plan.tier === SubscriptionTier.FREE || plan.amount === 0) {
      if (currentSub?.razorpaySubscriptionId) {
        try {
          await this.razorpayService.cancelSubscription(currentSub.razorpaySubscriptionId, false);
        } catch (err: any) {
          this.logger.warn(`Could not cancel existing Razorpay subscription: ${err.message}`);
        }
      }

      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 30);

      await this.prisma.$transaction(async (tx) => {
        await tx.subscription.upsert({
          where: { projectId: dto.projectId },
          create: {
            projectId: dto.projectId,
            tier: plan.tier,
            status: SubscriptionStatus.ACTIVE,
            planId: plan.id,
            currentPeriodStart: new Date(),
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: false,
          },
          update: {
            tier: plan.tier,
            status: SubscriptionStatus.ACTIVE,
            planId: plan.id,
            razorpaySubscriptionId: null,
            razorpayPlanId: null,
            cancelAtPeriodEnd: false,
          },
        });

        await tx.subscriptionHistory.create({
          data: {
            subscriptionId: currentSub?.id || dto.projectId,
            projectId: dto.projectId,
            action: plan.tier === SubscriptionTier.FREE ? 'DOWNGRADE_TO_FREE' : 'UPGRADE_FREE_MODE',
            fromTier: currentSub?.tier || null,
            toTier: plan.tier,
            actorId: user.id,
            metadata: { planId: plan.id, paymentEnabled },
          },
        });

        await tx.auditLog.create({
          data: {
            action: plan.tier === SubscriptionTier.FREE ? 'SUBSCRIPTION_DOWNGRADED' : 'SUBSCRIPTION_UPGRADED',
            resource: 'BILLING',
            projectId: dto.projectId,
            userId: user.id,
            metadata: { targetTier: plan.tier, paymentEnabled },
          },
        });
      });

      return {
        success: true,
        isFree: true,
        paymentEnabled,
        message: !paymentEnabled
          ? `Successfully switched to ${plan.name} (Payments disabled)`
          : `Successfully updated to ${plan.name}`,
        planName: plan.name,
        tier: plan.tier,
        checkoutUrl: '/dashboard/subscription?checkout=success',
      };
    }

    // For paid plans, ensure Razorpay Plan ID exists
    let rzpPlanId = plan.razorpayPlanId;
    if (!rzpPlanId) {
      const createdRzpPlan = await this.razorpayService.createPlan({
        name: plan.name,
        amount: plan.amount,
        period: plan.interval === BillingInterval.MONTHLY ? 'monthly' : 'yearly',
        interval: 1,
        description: plan.description || '',
      });
      rzpPlanId = createdRzpPlan.id;
      await this.prisma.plan.update({
        where: { id: plan.id },
        data: { razorpayPlanId: rzpPlanId },
      });
    }

    // Create recurring subscription in Razorpay
    const rzpSub = await this.razorpayService.createSubscription({
      planId: rzpPlanId,
      notes: {
        projectId: dto.projectId,
        userId: user.id,
        planId: plan.id,
      },
    });

    // Record checkout intent in DB
    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.upsert({
        where: { projectId: dto.projectId },
        create: {
          projectId: dto.projectId,
          tier: plan.tier,
          status: SubscriptionStatus.TRIALING,
          planId: plan.id,
          razorpaySubscriptionId: rzpSub.id,
          razorpayPlanId: rzpPlanId,
        },
        update: {
          planId: plan.id,
          razorpaySubscriptionId: rzpSub.id,
          razorpayPlanId: rzpPlanId,
        },
      });

      await tx.subscriptionHistory.create({
        data: {
          subscriptionId: currentSub?.id || dto.projectId,
          projectId: dto.projectId,
          action: 'CHECKOUT_INITIATED',
          fromTier: currentSub?.tier,
          toTier: plan.tier,
          actorId: user.id,
          metadata: {
            razorpaySubscriptionId: rzpSub.id,
            planId: plan.id,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'CHECKOUT_INITIATED',
          resource: 'BILLING',
          projectId: dto.projectId,
          userId: user.id,
          metadata: {
            planId: plan.id,
            tier: plan.tier,
            amount: plan.amount,
            razorpaySubscriptionId: rzpSub.id,
          },
        },
      });
    });

    return {
      success: true,
      isFree: false,
      keyId: this.razorpayService.getKeyId(),
      subscriptionId: rzpSub.id,
      planId: plan.id,
      planName: plan.name,
      amount: plan.amount,
      currency: plan.currency,
      description: plan.description,
      customerEmail: user.email,
      customerName: user.name || '',
    };
  }

  /**
   * Verifies Razorpay payment signature and activates the subscription.
   * Only Project OWNER can verify payments.
   */
  async verifyPayment(firebaseUser: FirebaseUser, dto: VerifyPaymentDto) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);

    // Enforce Project OWNER permission
    await this.projectAuth.authorize(dto.projectId, user.id, [ProjectRole.OWNER]);

    const sub = await this.prisma.subscription.findUnique({
      where: { projectId: dto.projectId },
      include: { plan: true },
    });

    if (!sub) {
      throw new NotFoundException('Subscription not found for this project');
    }

    if (sub.razorpaySubscriptionId !== dto.razorpaySubscriptionId) {
      throw new BadRequestException('Mismatched Razorpay subscription identifier');
    }

    // Verify cryptographic signature
    const isValid = this.razorpayService.verifyPaymentSignature({
      razorpayPaymentId: dto.razorpayPaymentId,
      razorpaySubscriptionId: dto.razorpaySubscriptionId,
      razorpaySignature: dto.razorpaySignature,
    });

    if (!isValid) {
      this.logger.warn(`Signature verification failed for payment ${dto.razorpayPaymentId}`);
      await this.prisma.auditLog.create({
        data: {
          action: 'PAYMENT_SIGNATURE_INVALID',
          resource: 'BILLING',
          projectId: dto.projectId,
          userId: user.id,
          metadata: {
            paymentId: dto.razorpayPaymentId,
            subscriptionId: dto.razorpaySubscriptionId,
          },
        },
      });
      throw new BadRequestException('Invalid Razorpay payment signature');
    }

    // Fetch payment information from Razorpay or use plan defaults
    let amount = sub.plan?.amount || 0;
    let currency = sub.plan?.currency || 'INR';
    let method = 'card';

    try {
      const rzpPayment = await this.razorpayService.fetchPayment(dto.razorpayPaymentId);
      if (rzpPayment) {
        amount = rzpPayment.amount || amount;
        currency = rzpPayment.currency || currency;
        method = rzpPayment.method || method;
      }
    } catch (err: any) {
      this.logger.warn(`Could not fetch payment details from Razorpay: ${err.message}`);
    }

    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    if (sub.plan?.interval === BillingInterval.YEARLY) {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    } else {
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);
    }

    // Atomically activate subscription and record payment
    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: sub.id },
        data: {
          status: SubscriptionStatus.ACTIVE,
          tier: sub.plan?.tier || sub.tier,
          currentPeriodStart,
          currentPeriodEnd,
          nextBillingDate: currentPeriodEnd,
          cancelAtPeriodEnd: false,
        },
      });

      // Record payment transaction
      await tx.payment.upsert({
        where: { razorpayPaymentId: dto.razorpayPaymentId },
        create: {
          projectId: dto.projectId,
          subscriptionId: sub.id,
          razorpayPaymentId: dto.razorpayPaymentId,
          razorpaySignature: dto.razorpaySignature,
          amount,
          currency,
          status: PaymentStatus.CAPTURED,
          method,
        },
        update: {
          status: PaymentStatus.CAPTURED,
        },
      });

      await tx.subscriptionHistory.create({
        data: {
          subscriptionId: sub.id,
          projectId: dto.projectId,
          action: 'PAYMENT_VERIFIED_ACTIVATED',
          fromStatus: sub.status,
          toStatus: SubscriptionStatus.ACTIVE,
          actorId: user.id,
          metadata: {
            paymentId: dto.razorpayPaymentId,
            amount,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'PAYMENT_VERIFIED',
          resource: 'BILLING',
          projectId: dto.projectId,
          userId: user.id,
          metadata: {
            paymentId: dto.razorpayPaymentId,
            amount,
            tier: sub.tier,
          },
        },
      });
    });

    this.logger.log(`Subscription verified & activated for project ${dto.projectId} [Payment: ${dto.razorpayPaymentId}]`);

    return {
      success: true,
      message: 'Payment verified and subscription activated',
      tier: sub.plan?.tier || sub.tier,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: currentPeriodEnd.toISOString(),
    };
  }

  /**
   * Cancels subscription at period end. Only Project OWNER can cancel.
   */
  async cancelSubscription(firebaseUser: FirebaseUser, dto: CancelSubscriptionDto) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);

    // Enforce Project OWNER permission
    await this.projectAuth.authorize(dto.projectId, user.id, [ProjectRole.OWNER]);

    const sub = await this.prisma.subscription.findUnique({
      where: { projectId: dto.projectId },
    });

    if (!sub || sub.status === SubscriptionStatus.CANCELED) {
      return {
        success: true,
        message: 'No active paid subscription found to cancel',
        status: 'cancelled',
      };
    }

    if (sub.razorpaySubscriptionId) {
      try {
        await this.razorpayService.cancelSubscription(sub.razorpaySubscriptionId, true);
      } catch (err: any) {
        this.logger.warn(`Razorpay provider cancel note: ${err.message}`);
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: sub.id },
        data: {
          cancelAtPeriodEnd: true,
          canceledAt: new Date(),
        },
      });

      await tx.subscriptionHistory.create({
        data: {
          subscriptionId: sub.id,
          projectId: dto.projectId,
          action: 'SUBSCRIPTION_CANCEL_SCHEDULED',
          fromStatus: sub.status,
          toStatus: sub.status,
          actorId: user.id,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'SUBSCRIPTION_CANCELLED',
          resource: 'BILLING',
          projectId: dto.projectId,
          userId: user.id,
          metadata: { subscriptionId: sub.id },
        },
      });
    });

    return {
      success: true,
      message: 'Subscription marked for cancellation at period end',
      cancelAtPeriodEnd: true,
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() || null,
    };
  }

  /**
   * Retrieves paginated payment history for a project. Only Project OWNER can access.
   */
  async getPaymentHistory(firebaseUser: FirebaseUser, dto: PaymentHistoryQueryDto) {
    const user = await this.usersService.findOrCreateFromFirebase(firebaseUser);

    // Enforce Project OWNER permission
    await this.projectAuth.authorize(dto.projectId, user.id, [ProjectRole.OWNER]);

    const page = dto.page || 1;
    const limit = dto.limit || 10;
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { projectId: dto.projectId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({
        where: { projectId: dto.projectId },
      }),
    ]);

    return {
      data: payments.map((p) => ({
        id: p.id,
        paymentId: p.razorpayPaymentId,
        amount: p.amount,
        amountFormatted: `₹${(p.amount / 100).toFixed(2)}`,
        currency: p.currency,
        status: p.status.toLowerCase(),
        method: p.method || 'online',
        createdAt: p.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
