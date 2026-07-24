import { z } from 'zod';

export const createQuotationSchema = z.object({
  rfqId: z.union([z.number().int().positive(), z.string()]).optional(),
  vendorId: z.union([z.number().int().positive(), z.string()]).optional(),
  amount: z.number().nonnegative('Amount must be positive'),
  remarks: z.string().optional()
}).passthrough();

export const updateQuotationStatusSchema = z.object({
  status: z.enum(['approved', 'rejected'], { required_error: 'Valid status is required' })
});
