import { z } from 'zod';

export const createItemUnitSchema = z.object({
  name: z.string().min(2, 'Unit name must be at least 2 characters'),
  shortName: z.string().min(1, 'Short name is required').max(10, 'Short name too long')
});

export const updateItemUnitSchema = z.object({
  name: z.string().min(2).optional(),
  shortName: z.string().min(1).max(10).optional(),
  status: z.enum(['active', 'inactive']).optional()
});
