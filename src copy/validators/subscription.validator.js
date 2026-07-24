import { z } from 'zod';

export const createSubscriptionSchema = z.object({
  body: z.object({
    tenantId: z.number().int().positive(),
    planId: z.number().int().positive(),
  }),
});

export const updateSubscriptionSchema = z.object({
  body: z.object({
    status: z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED']).optional(),
    paymentStatus: z.string().optional(),
    autoRenew: z.boolean().optional(),
  }),
});
