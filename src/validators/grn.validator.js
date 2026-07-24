import { z } from 'zod';

const grnItemSchema = z.object({
  itemId: z.number().int().positive('Item ID is required'),
  orderedQuantity: z.number().positive('Ordered Quantity must be positive'),
  receivedQuantity: z.number().nonnegative('Received Quantity must be non-negative'),
  acceptedQuantity: z.number().nonnegative('Accepted Quantity must be non-negative'),
  rejectedQuantity: z.number().nonnegative().optional().default(0),
  unitPrice: z.number().nonnegative('Unit Price must be non-negative'),
  remarks: z.string().optional()
});

export const createGRNSchema = z.object({
  purchaseOrderId: z.number().int().positive('Purchase Order ID is required'),
  vendorId: z.number().int().positive('Vendor ID is required'),
  warehouseId: z.number().int().positive('Warehouse ID is required'),
  deliveryChallan: z.string().optional(),
  remarks: z.string().optional(),
  items: z.array(grnItemSchema).min(1, 'At least one item must be received')
});

export const updateGRNStatusSchema = z.object({
  status: z.enum(['approved', 'rejected'], { required_error: 'Valid status is required' })
});
