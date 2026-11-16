import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RazorpayService } from './razorpay.service';
import { SubscriptionTier, BillingInterval } from '@prisma/client';

export interface DefaultPlanConfig {
  name: string;
  tier: SubscriptionTier;
  interval: BillingInterval;
  amount: number; // in paise
  description: string;
  features: string[];
  maxDatabases: number;
  maxCpuCores: number;
  maxRamMb: number;
  maxStorageMb: number;
}

export const DEFAULT_PLANS: DefaultPlanConfig[] = [
  // FREE Tier
  {
    name: 'Developer Sandbox (Free)',
    tier: SubscriptionTier.FREE,
    interval: BillingInterval.MONTHLY,
    amount: 0,
    description: 'Essential sandbox compute for local development and evaluations',
    features: [
      'Up to 2 Database Instances',
      'Up to 4 vCPUs Total',
      '4 GB RAM Total',
      '20 GB Storage',
      'Standard isolation',
      'Community support',
    ],
    maxDatabases: 2,
    maxCpuCores: 4,
    maxRamMb: 4096,
    maxStorageMb: 20480,
  },
  {
    name: 'Developer Sandbox (Free Yearly)',
    tier: SubscriptionTier.FREE,
    interval: BillingInterval.YEARLY,
    amount: 0,
    description: 'Essential sandbox compute for local development and evaluations',
    features: [
      'Up to 2 Database Instances',
      'Up to 4 vCPUs Total',
      '4 GB RAM Total',
      '20 GB Storage',
      'Standard isolation',
      'Community support',
    ],
    maxDatabases: 2,
    maxCpuCores: 4,
    maxRamMb: 4096,
    maxStorageMb: 20480,
  },

  // BASIC Tier
  {
    name: 'Team / Production (Monthly)',
    tier: SubscriptionTier.BASIC,
    interval: BillingInterval.MONTHLY,
    amount: 199900, // ₹1,999 / mo
    description: 'Higher resource limits and enhanced telemetry for team workloads',
    features: [
      'Up to 5 Database Instances',
      'Up to 16 vCPUs Total',
      '16 GB RAM Total',
      '100 GB NVMe Storage',
      'Automated daily backups',
      'Priority telemetry & metrics',
      'Business hours support',
    ],
    maxDatabases: 5,
    maxCpuCores: 16,
    maxRamMb: 16384,
    maxStorageMb: 102400,
  },
  {
    name: 'Team / Production (Yearly)',
    tier: SubscriptionTier.BASIC,
    interval: BillingInterval.YEARLY,
    amount: 1999000, // ₹19,990 / yr (~17% discount)
    description: 'Higher resource limits and enhanced telemetry for team workloads with annual savings',
    features: [
      'Up to 5 Database Instances',
      'Up to 16 vCPUs Total',
      '16 GB RAM Total',
      '100 GB NVMe Storage',
      'Automated daily backups',
      'Priority telemetry & metrics',
      'Business hours support',
    ],
    maxDatabases: 5,
    maxCpuCores: 16,
    maxRamMb: 16384,
    maxStorageMb: 102400,
  },

  // PRO Tier
  {
    name: 'Enterprise Dedicated (Monthly)',
    tier: SubscriptionTier.PRO,
    interval: BillingInterval.MONTHLY,
    amount: 799900, // ₹7,999 / mo
    description: 'High-performance ceilings and dedicated multi-tenant isolation',
    features: [
      'Up to 20 Database Instances',
      'Up to 64 vCPUs Total',
      '64 GB RAM Total',
      '500 GB NVMe Storage',
      'Hourly snapshot backups',
      'Custom isolation subnets',
      '24/7 Enterprise platform SLA',
    ],
    maxDatabases: 20,
    maxCpuCores: 64,
    maxRamMb: 65536,
    maxStorageMb: 512000,
  },
  {
    name: 'Enterprise Dedicated (Yearly)',
    tier: SubscriptionTier.PRO,
    interval: BillingInterval.YEARLY,
    amount: 7999000, // ₹79,990 / yr (~17% discount)
    description: 'High-performance ceilings and dedicated multi-tenant isolation with annual savings',
    features: [
      'Up to 20 Database Instances',
      'Up to 64 vCPUs Total',
      '64 GB RAM Total',
      '500 GB NVMe Storage',
      'Hourly snapshot backups',
      'Custom isolation subnets',
      '24/7 Enterprise platform SLA',
    ],
    maxDatabases: 20,
    maxCpuCores: 64,
    maxRamMb: 65536,
    maxStorageMb: 512000,
  },
];

@Injectable()
export class PlanSeedService implements OnModuleInit {
  private readonly logger = new Logger(PlanSeedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpayService: RazorpayService,
  ) {}

  async onModuleInit() {
    await this.syncPlans();
  }

  async syncPlans(): Promise<void> {
    try {
      for (const config of DEFAULT_PLANS) {
        let plan = await this.prisma.plan.findUnique({
          where: {
            tier_interval: {
              tier: config.tier,
              interval: config.interval,
            },
          },
        });

        if (!plan) {
          let razorpayPlanId: string | null = null;
          if (config.amount > 0) {
            try {
              const rzpPlan = await this.razorpayService.createPlan({
                name: config.name,
                amount: config.amount,
                period: config.interval === BillingInterval.MONTHLY ? 'monthly' : 'yearly',
                interval: 1,
                description: config.description,
              });
              razorpayPlanId = rzpPlan.id;
            } catch (err: any) {
              this.logger.warn(`Could not register Razorpay plan for ${config.name}: ${err.message}`);
            }
          }

          plan = await this.prisma.plan.create({
            data: {
              name: config.name,
              tier: config.tier,
              interval: config.interval,
              amount: config.amount,
              currency: 'INR',
              razorpayPlanId,
              description: config.description,
              features: config.features,
              maxDatabases: config.maxDatabases,
              maxCpuCores: config.maxCpuCores,
              maxRamMb: config.maxRamMb,
              maxStorageMb: config.maxStorageMb,
              isActive: true,
            },
          });
          this.logger.log(`Created plan: ${plan.name} (${plan.tier} ${plan.interval}) [Razorpay: ${razorpayPlanId || 'N/A'}]`);
        } else if (!plan.razorpayPlanId && config.amount > 0) {
          // Synchronize missing Razorpay Plan ID
          try {
            const rzpPlan = await this.razorpayService.createPlan({
              name: config.name,
              amount: config.amount,
              period: config.interval === BillingInterval.MONTHLY ? 'monthly' : 'yearly',
              interval: 1,
              description: config.description,
            });
            await this.prisma.plan.update({
              where: { id: plan.id },
              data: { razorpayPlanId: rzpPlan.id },
            });
            this.logger.log(`Updated Razorpay plan ID for ${plan.name}: ${rzpPlan.id}`);
          } catch (err: any) {
            this.logger.warn(`Could not sync Razorpay plan for ${plan.name}: ${err.message}`);
          }
        }
      }
    } catch (err: any) {
      this.logger.error(`Plan synchronization error: ${err.message}`);
    }
  }
}
