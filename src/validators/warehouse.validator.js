import { z } from 'zod';

export const createWarehouseSchema = z.object({
  name: z.string().min(2, 'Warehouse name must be at least 2 characters'),
  location: z.string().optional(),
  managerId: z.number().int().positive('Manager ID is optional but must be valid if provided').optional().nullable(),
  capacity: z.number().int().nonnegative().optional(),
  status: z.enum(['active', 'inactive']).optional()
});

export const updateWarehouseSchema = z.object({
  name: z.string().min(2).optional(),
  location: z.string().optional(),
  managerId: z.number().int().positive().optional().nullable(),
  capacity: z.number().int().nonnegative().optional(),
  status: z.enum(['active', 'inactive']).optional()
});
