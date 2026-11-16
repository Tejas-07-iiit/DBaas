import { z } from 'zod';

export const checkoutSubscriptionSchema = z.object({
  projectId: z.string().uuid({ message: 'Valid Project UUID is required' }),
  planId: z.string().min(1, { message: 'Plan ID is required' }),
});

export type CheckoutSubscriptionDto = z.infer<typeof checkoutSubscriptionSchema>;

export const verifyPaymentSchema = z.object({
  projectId: z.string().uuid({ message: 'Valid Project UUID is required' }),
  razorpayPaymentId: z.string().min(1, { message: 'razorpayPaymentId is required' }),
  razorpaySubscriptionId: z.string().min(1, { message: 'razorpaySubscriptionId is required' }),
  razorpaySignature: z.string().min(1, { message: 'razorpaySignature is required' }),
});

export type VerifyPaymentDto = z.infer<typeof verifyPaymentSchema>;

export const cancelSubscriptionSchema = z.object({
  projectId: z.string().uuid({ message: 'Valid Project UUID is required' }),
});

export type CancelSubscriptionDto = z.infer<typeof cancelSubscriptionSchema>;

export const paymentHistoryQuerySchema = z.object({
  projectId: z.string().uuid({ message: 'Valid Project UUID is required' }),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type PaymentHistoryQueryDto = z.infer<typeof paymentHistoryQuerySchema>;
