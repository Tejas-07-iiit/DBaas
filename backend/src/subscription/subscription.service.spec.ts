import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionTier, SubscriptionStatus, ProjectRole, BillingInterval } from '@prisma/client';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let mockPrisma: any;
  let mockUsersService: any;
  let mockProjectAuth: any;
  let mockRazorpayService: any;

  const mockUser = { id: 'usr-1111', email: 'owner@example.com', name: 'Project Owner' };
  const mockFirebaseUser = { uid: 'firebase-1', email: 'owner@example.com' };
  const mockProjectId = '22222222-2222-2222-2222-222222222222';

  const mockPlan = {
    id: 'plan-basic-uuid',
    name: 'Team / Production (Monthly)',
    tier: SubscriptionTier.BASIC,
    interval: BillingInterval.MONTHLY,
    amount: 199900,
    currency: 'INR',
    razorpayPlanId: 'plan_rzp_123',
    isActive: true,
    maxDatabases: 5,
    maxCpuCores: 16,
    maxRamMb: 16384,
    maxStorageMb: 102400,
  };

  beforeEach(() => {
    mockPrisma = {
      plan: {
        findMany: jest.fn().mockResolvedValue([mockPlan]),
        findUnique: jest.fn().mockResolvedValue(mockPlan),
        findFirst: jest.fn().mockResolvedValue(mockPlan),
        update: jest.fn(),
      },
      subscription: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'sub-uuid',
          projectId: mockProjectId,
          tier: SubscriptionTier.FREE,
          status: SubscriptionStatus.ACTIVE,
          razorpaySubscriptionId: 'sub_rzp_test_1',
          plan: mockPlan,
        }),
        create: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
      },
      subscriptionHistory: {
        create: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      payment: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        upsert: jest.fn(),
      },
      databaseInstance: {
        count: jest.fn().mockResolvedValue(1),
        aggregate: jest.fn().mockResolvedValue({
          _sum: { cpuCores: 2, ramMb: 2048, storageMb: 10240 },
        }),
      },
      project: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      projectMember: {
        findUnique: jest.fn().mockResolvedValue({ role: ProjectRole.OWNER }),
      },
      $transaction: jest.fn().mockImplementation((cb) => cb(mockPrisma)),
    };

    mockUsersService = {
      findOrCreateFromFirebase: jest.fn().mockResolvedValue(mockUser),
    };

    mockProjectAuth = {
      authorize: jest.fn().mockResolvedValue({
        project: { id: mockProjectId, ownerId: mockUser.id, name: 'Production Cloud' },
        membership: { role: ProjectRole.OWNER },
      }),
    };

    mockRazorpayService = {
      getKeyId: jest.fn().mockReturnValue('rzp_test_mock_key'),
      createPlan: jest.fn().mockResolvedValue({ id: 'plan_rzp_new' }),
      createSubscription: jest.fn().mockResolvedValue({ id: 'sub_rzp_test_1', status: 'created' }),
      cancelSubscription: jest.fn().mockResolvedValue({ id: 'sub_rzp_test_1', status: 'cancelled' }),
      fetchPayment: jest.fn().mockResolvedValue({ id: 'pay_123', amount: 199900, currency: 'INR', status: 'captured' }),
      verifyPaymentSignature: jest.fn().mockReturnValue(true),
    };

    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'paymentEnabled') return true;
        return defaultValue;
      }),
    };

    service = new SubscriptionService(
      mockPrisma,
      mockUsersService,
      mockProjectAuth,
      mockRazorpayService,
      mockConfigService as any,
    );
  });

  describe('listPlans', () => {
    it('should return catalog of active plans formatted from PostgreSQL', async () => {
      const plans = await service.listPlans();
      expect(plans).toHaveLength(1);
      expect(plans[0].name).toBe('Team / Production (Monthly)');
      expect(plans[0].price).toBe('1999');
      expect(plans[0].limits.maxDatabases).toBe(5);
    });
  });

  describe('checkoutPlan', () => {
    it('should allow Project OWNER to initialize checkout for paid tier', async () => {
      const result = await service.checkoutPlan(mockFirebaseUser as any, {
        projectId: mockProjectId,
        planId: mockPlan.id,
      });

      expect(mockProjectAuth.authorize).toHaveBeenCalledWith(
        mockProjectId,
        mockUser.id,
        [ProjectRole.OWNER],
      );
      expect(mockRazorpayService.createSubscription).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.subscriptionId).toBe('sub_rzp_test_1');
      expect(result.amount).toBe(199900);
    });

    it('should activate paid plan directly without Razorpay when PAYMENT_ENABLED is false', async () => {
      const mockConfigDisabled = {
        get: jest.fn().mockReturnValue(false),
      };
      const disabledService = new SubscriptionService(
        mockPrisma,
        mockUsersService,
        mockProjectAuth,
        mockRazorpayService,
        mockConfigDisabled as any,
      );

      const result = await disabledService.checkoutPlan(mockFirebaseUser as any, {
        projectId: mockProjectId,
        planId: mockPlan.id,
      });

      expect(result.success).toBe(true);
      expect(result.isFree).toBe(true);
      expect(result.paymentEnabled).toBe(false);
      expect(mockRazorpayService.createSubscription).not.toHaveBeenCalled();
      expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: mockProjectId },
          create: expect.objectContaining({ tier: SubscriptionTier.BASIC }),
          update: expect.objectContaining({ tier: SubscriptionTier.BASIC }),
        }),
      );
    });

    it('should reject checkout when actor is not Project OWNER', async () => {
      mockProjectAuth.authorize.mockRejectedValueOnce(
        new ForbiddenException('You do not have the required permissions'),
      );

      await expect(
        service.checkoutPlan(mockFirebaseUser as any, {
          projectId: mockProjectId,
          planId: mockPlan.id,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject checkout if requested plan does not exist', async () => {
      mockPrisma.plan.findUnique.mockResolvedValueOnce(null);
      mockPrisma.plan.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.checkoutPlan(mockFirebaseUser as any, {
          projectId: mockProjectId,
          planId: 'non-existent-plan',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyPayment', () => {
    it('should activate subscription when payment signature is valid', async () => {
      const result = await service.verifyPayment(mockFirebaseUser as any, {
        projectId: mockProjectId,
        razorpayPaymentId: 'pay_123',
        razorpaySubscriptionId: 'sub_rzp_test_1',
        razorpaySignature: 'valid_hmac_signature',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
      expect(mockPrisma.subscription.update).toHaveBeenCalled();
      expect(mockPrisma.payment.upsert).toHaveBeenCalled();
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'PAYMENT_VERIFIED',
            resource: 'BILLING',
          }),
        }),
      );
    });

    it('should reject payment verification when signature is invalid', async () => {
      mockRazorpayService.verifyPaymentSignature.mockReturnValueOnce(false);

      await expect(
        service.verifyPayment(mockFirebaseUser as any, {
          projectId: mockProjectId,
          razorpayPaymentId: 'pay_123',
          razorpaySubscriptionId: 'sub_rzp_test_1',
          razorpaySignature: 'tampered_signature',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject payment verification when subscription id mismatches', async () => {
      await expect(
        service.verifyPayment(mockFirebaseUser as any, {
          projectId: mockProjectId,
          razorpayPaymentId: 'pay_123',
          razorpaySubscriptionId: 'sub_wrong_id',
          razorpaySignature: 'valid_sig',
        }),
      ).rejects.toThrow(/Mismatched Razorpay subscription identifier/);
    });
  });

  describe('cancelSubscription', () => {
    it('should schedule cancellation at period end for Project OWNER', async () => {
      const result = await service.cancelSubscription(mockFirebaseUser as any, {
        projectId: mockProjectId,
      });

      expect(mockProjectAuth.authorize).toHaveBeenCalledWith(
        mockProjectId,
        mockUser.id,
        [ProjectRole.OWNER],
      );
      expect(mockRazorpayService.cancelSubscription).toHaveBeenCalledWith('sub_rzp_test_1', true);
      expect(result.success).toBe(true);
      expect(result.cancelAtPeriodEnd).toBe(true);
    });
  });

  describe('getPaymentHistory', () => {
    it('should return paginated payment records for Project OWNER', async () => {
      mockPrisma.payment.findMany.mockResolvedValueOnce([
        {
          id: 'pay-uuid-1',
          razorpayPaymentId: 'pay_rzp_1',
          amount: 199900,
          currency: 'INR',
          status: 'CAPTURED',
          method: 'card',
          createdAt: new Date(),
        },
      ]);
      mockPrisma.payment.count.mockResolvedValueOnce(1);

      const result = await service.getPaymentHistory(mockFirebaseUser as any, {
        projectId: mockProjectId,
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].amountFormatted).toBe('₹1999.00');
      expect(result.pagination.total).toBe(1);
    });
  });
});
