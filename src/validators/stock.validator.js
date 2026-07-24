import { z } from 'zod';

export const adjustStockSchema = z.object({
  warehouseId: z.number().int().positive('Warehouse ID is required'),
  itemId: z.number().int().positive('Item ID is required'),
  quantity: z.number().positive('Quantity must be positive'),
  type: z.enum(['ADD', 'DEDUCT'], { required_error: 'Type must be ADD or DEDUCT' }),
  remarks: z.string().optional(),
  referenceType: z.string().optional(),
  movementType: z.string().optional()
});

export const transferStockSchema = z.object({
  sourceWarehouseId: z.number().int().positive('Source Warehouse ID is required'),
  destinationWarehouseId: z.number().int().positive('Destination Warehouse ID is required'),
  itemId: z.number().int().positive('Item ID is required'),
  quantity: z.number().positive('Quantity must be positive'),
  remarks: z.string().optional()
});
