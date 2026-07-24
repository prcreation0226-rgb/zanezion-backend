import { z } from 'zod';

export const createPurchaseOrderSchema = z.object({
  vendorId: z.number().int().positive('Vendor ID is required'),
  purchaseRequestId: z.number().int().positive('Purchase Request ID is required'),
  quotationId: z.number().int().positive('Quotation ID is required').optional(),
  totalAmount: z.number().nonnegative('Total Amount must be non-negative'),
  paymentTerms: z.string().optional()
});

export const updatePurchaseOrderStatusSchema = z.object({
  status: z.string({ required_error: 'Valid status is required' })
});

const purchaseOrderItemSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  name: z.string().min(1, 'Item name is required'),
  orderedQty: z.number().positive('Ordered quantity must be positive'),
  price: z.number().nonnegative('Unit price must be non-negative'),
  category: z.string().optional(),
  receivedQty: z.number().nonnegative().optional(),
  pendingQty: z.number().nonnegative().optional()
});

export const updatePurchaseOrderSchema = z.object({
  paymentTerms: z.string().optional(),
  status: z.string().optional(),
  totalAmount: z.number().nonnegative().optional(),
  items: z.array(purchaseOrderItemSchema).optional()
});
