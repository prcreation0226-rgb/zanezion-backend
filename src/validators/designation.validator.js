import { z } from 'zod';

export const createDesignationSchema = z.object({
  departmentId: z.number().int().positive('Department ID is required'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional()
});

export const updateDesignationSchema = z.object({
  departmentId: z.number().int().positive().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional()
});
