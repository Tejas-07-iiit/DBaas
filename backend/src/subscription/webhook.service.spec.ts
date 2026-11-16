import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookStatus, SubscriptionStatus, PaymentStatus } from '@prisma/client';

describe('WebhookService', () => {
  let service: WebhookService;
  let mockPrisma: any;
  let mockRazorpayService: any;

  beforeEach(() => {
    mockPrisma = {
      webhookEvent: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'evt-db-1' }),
        update: jest.fn(),
      },
      subscription: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'sub-db-1',
          projectId: 'proj-1',
          status: SubscriptionStatus.TRIALING,
        }),
        update: jest.fn(),
      },
      subscriptionHistory: {
        create: jest.fn(),
      },
      payment: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation((cb) => cb(mockPrisma)),
    };

    mockRazorpayService = {
      verifyWebhookSignature: jest.fn().mockReturnValue(true),
    };

    service = new WebhookService(mockPrisma, mockRazorpayService);
  });

  it('should reject webhook if X-Razorpay-Signature is missing', async () => {
    await expect(
      service.handleWebhook('{"event":"test"}', undefined),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should reject webhook if HMAC signature fails verification', async () => {
    mockRazorpayService.verifyWebhookSignature.mockReturnValueOnce(false);

    await expect(
      service.handleWebhook('{"event":"test"}', 'invalid_signature'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should gracefully ignore already processed events for idempotency', async () => {
    mockPrisma.webhookEvent.findUnique.mockResolvedValueOnce({
      id: 'evt-db-1',
      providerEventId: 'evt_dup_123',
      status: WebhookStatus.PROCESSED,
    });

    const payload = JSON.stringify({
      id: 'evt_dup_123',
      event: 'subscription.charged',
      payload: {},
    });

    const result = await service.handleWebhook(payload, 'valid_signature');
    expect(result.idempotentHit).toBe(true);
    expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
  });

  it('should process subscription.activated event', async () => {
    const payload = JSON.stringify({
      id: 'evt_act_1',
      event: 'subscription.activated',
      payload: {
        subscription: {
          entity: {
            id: 'sub_rzp_1',
            current_start: 1700000000,
            current_end: 1702592000,
          },
        },
      },
    });

    const result = await service.handleWebhook(payload, 'valid_signature');
    expect(result.status).toBe('processed');
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: SubscriptionStatus.ACTIVE,
        }),
      }),
    );
  });

  it('should process subscription.charged event and record payment', async () => {
    const payload = JSON.stringify({
      id: 'evt_charge_1',
      event: 'subscription.charged',
      payload: {
        subscription: {
          entity: {
            id: 'sub_rzp_1',
            current_start: 1700000000,
            current_end: 1702592000,
          },
        },
        payment: {
          entity: {
            id: 'pay_rzp_1',
            amount: 199900,
            currency: 'INR',
            method: 'card',
          },
        },
      },
    });

    const result = await service.handleWebhook(payload, 'valid_signature');
    expect(result.status).toBe('processed');
    expect(mockPrisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          razorpayPaymentId: 'pay_rzp_1',
          amount: 199900,
          status: PaymentStatus.CAPTURED,
        }),
      }),
    );
  });

  it('should transition subscription to PAST_DUE on subscription.halted', async () => {
    const payload = JSON.stringify({
      id: 'evt_halt_1',
      event: 'subscription.halted',
      payload: {
        subscription: {
          entity: {
            id: 'sub_rzp_1',
          },
        },
      },
    });

    const result = await service.handleWebhook(payload, 'valid_signature');
    expect(result.status).toBe('processed');
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: SubscriptionStatus.PAST_DUE,
        }),
      }),
    );
  });
});
