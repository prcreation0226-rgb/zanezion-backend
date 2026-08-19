import { z } from 'zod';

const invoiceItemSchema = z.object({
  itemId: z.union([z.number(), z.string()]).transform(v => Number(v) || 1).default(1),
  quantity: z.union([z.number(), z.string()]).transform(v => Number(v) || 1).default(1),
  unitPrice: z.union([z.number(), z.string()]).transform(v => Number(v) || 0).default(0),
  tax: z.union([z.number(), z.string()]).transform(v => Number(v) || 0).default(0),
  discount: z.union([z.number(), z.string()]).transform(v => Number(v) || 0).default(0)
});

export const generateInvoiceSchema = z.object({
  deliveryId: z.union([z.number().int(), z.string(), z.null()]).optional(),
  orderId: z.union([z.number().int(), z.string(), z.null()]).optional(),
  dueDate: z.string().optional().default(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  clientId: z.union([z.number().int(), z.string(), z.null()]).optional(),
  paidAmount: z.union([z.number(), z.string()]).transform(v => Number(v) || 0).default(0)
});

