import { z } from 'zod';

const invoiceItemSchema = z.object({
  itemId: z.number().int().positive('Item ID is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().nonnegative('Unit Price must be non-negative'),
  tax: z.number().nonnegative('Tax must be non-negative').default(0),
  discount: z.number().nonnegative('Discount must be non-negative').default(0)
});

export const generateInvoiceSchema = z.object({
  deliveryId: z.number().int().positive('Delivery ID is required'),
  dueDate: z.string().datetime('Due Date must be a valid ISO datetime'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  clientId: z.number().int().optional(),
  paidAmount: z.number().nonnegative().optional()
});
