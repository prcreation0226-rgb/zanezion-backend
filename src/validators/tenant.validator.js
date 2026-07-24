import { z } from 'zod';

export const createTenantSchema = z.object({
  body: z.object({
    organizationId: z.number().int().positive('Organization ID is required'),
    tenantCode: z.string().min(2, 'Tenant Code is required'),
  }),
});

export const updateTenantSchema = z.object({
  body: z.object({
    tenantCode: z.string().min(2).optional(),
    status: z.enum(['active', 'suspended']).optional(),
  }),
});
