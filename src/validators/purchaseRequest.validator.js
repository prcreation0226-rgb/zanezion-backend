import { z } from 'zod';

const itemSchema = z.object({
  itemName: z.string().min(2, 'Item name must be at least 2 characters'),
  description: z.string().optional(),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  estimatedCost: z.number().nonnegative().optional()
});

export const createPurchaseRequestSchema = z.object({
  title: z.string().min(1, 'Title must be at least 1 character').max(150),
  description: z.string().optional(),
  departmentId: z.number().int().positive('Department ID is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  requester_id: z.number().int().positive().nullable().optional(),
  requestedBy: z.number().int().positive().nullable().optional(),
  items: z.array(itemSchema).min(1, 'At least one item is required')
});

export const updatePurchaseRequestSchema = z.object({
  title: z.string().min(1).max(150).optional(),
  description: z.string().optional(),
  departmentId: z.number().int().positive().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.string().optional(),
  requester_id: z.number().int().positive().nullable().optional(),
  requestedBy: z.number().int().positive().nullable().optional(),
  items: z.array(itemSchema).optional() // Full replacement of items
});

export const changeStatusSchema = z.object({
  status: z.enum(['draft', 'submitted', 'pending', 'department_approved', 'procurement_review', 'approved', 'rejected', 'cancelled', 'ordered', 'completed'], { required_error: 'Valid status is required' })
});
