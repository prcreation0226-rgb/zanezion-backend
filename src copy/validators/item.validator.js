import { z } from 'zod';

export const createItemSchema = z.object({
  categoryId: z.number().int().positive('Category ID is required'),
  unitId: z.number().int().positive('Unit ID is required'),
  sku: z.string().min(2, 'SKU must be at least 2 characters').optional(),
  name: z.string().min(2, 'Item name must be at least 2 characters'),
  description: z.string().optional(),
  reorderLevel: z.number().nonnegative().optional(),
  qty: z.number().nonnegative().optional(),
  warehouseId: z.number().int().positive().optional(),
  price: z.number().nonnegative().optional(),
  inventoryType: z.string().optional(),
  clientId: z.number().int().positive().optional().nullable()
});

export const updateItemSchema = z.object({
  categoryId: z.number().int().positive().optional(),
  unitId: z.number().int().positive().optional(),
  sku: z.string().min(2).optional(),
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  reorderLevel: z.number().nonnegative().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  price: z.number().nonnegative().optional(),
  qty: z.number().nonnegative().optional(),
  warehouseId: z.number().int().positive().optional(),
  inventoryType: z.string().optional(),
  clientId: z.number().int().positive().optional().nullable()
});
