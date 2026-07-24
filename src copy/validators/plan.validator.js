import { z } from 'zod';

export const createPlanSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    description: z.string().optional(),
    price: z.number().min(0, 'Price must be positive'),
    billingCycle: z.enum(['MONTHLY', 'YEARLY']),
    maxUsers: z.number().int().min(1),
    maxStorage: z.number().int().min(1),
    features: z.any().optional(),
  }),
});

export const updatePlanSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    price: z.number().min(0).optional(),
    billingCycle: z.enum(['MONTHLY', 'YEARLY']).optional(),
    maxUsers: z.number().int().min(1).optional(),
    maxStorage: z.number().int().min(1).optional(),
    features: z.any().optional(),
  }),
});
