import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  code: z.string().min(2, 'Code must be at least 2 characters').max(20),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional()
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  code: z.string().min(2, 'Code must be at least 2 characters').max(20).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional()
});
