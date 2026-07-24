import { z } from 'zod';

export const createPermissionSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    module: z.string().min(2, 'Module is required'),
    action: z.string().min(2, 'Action is required'),
    description: z.string().optional(),
  }),
});

export const updatePermissionSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    module: z.string().min(2).optional(),
    action: z.string().min(2).optional(),
    description: z.string().optional(),
  }),
});
