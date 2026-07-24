import { z } from 'zod';

export const createRFQSchema = z.object({
  purchaseRequestId: z.number().int().positive('Purchase Request ID is required'),
  vendorId: z.number().int().positive('Vendor ID is required'),
  metadata: z.any().optional()
});

export const updateRFQStatusSchema = z.object({
  status: z.enum(['sent', 'received', 'closed', 'pending', 'accepted', 'rejected', 'expired'], { required_error: 'Valid status is required' }),
  metadata: z.any().optional()
});
