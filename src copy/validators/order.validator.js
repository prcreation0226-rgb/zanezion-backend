import { z } from 'zod';

const orderItemSchema = z.object({
  itemId: z.number().int().positive('Item ID is required').optional(),
  warehouseId: z.number().int().positive('Warehouse ID is required for stock allocation').optional(),
  quantity: z.union([z.number(), z.string()]).optional(),
  unitPrice: z.union([z.number(), z.string()]).optional(),
  name: z.string().optional(),
  qty: z.union([z.number(), z.string()]).optional(),
  price: z.union([z.number(), z.string()]).optional(),
}).passthrough();

export const createOrderSchema = z.object({
  clientId: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '' || val === 'CLT-GUEST') return undefined;
      if (typeof val === 'string' && val.trim() !== '') return Number(val);
      return val;
    },
    z.number({
      required_error: "Client selection is required",
      invalid_type_error: "Client ID must be a valid number",
    }).int().positive('Client selection is required').optional()
  ),
  vendorId: z.union([z.number(), z.string()]).nullable().optional(),
  companyId: z.union([z.number(), z.string()]).nullable().optional(),
  priority: z.enum(['normal', 'high', 'urgent']).optional().default('normal'),
  items: z.array(z.any()).optional()
}).passthrough();

export const updateOrderStatusSchema = z.object({
  status: z.string({ required_error: 'Valid status is required' }).min(1, 'Status cannot be empty')
});
