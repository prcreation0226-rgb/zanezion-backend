import { z } from 'zod';

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Role name must be at least 2 characters'),
    description: z.string().optional(),
  }),
});

export const updateRoleSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
  }),
});

export const assignPermissionsSchema = z.object({
  body: z.object({
    permissionIds: z.array(z.number().int().positive()).min(1, 'At least one permission ID is required'),
  }),
});
