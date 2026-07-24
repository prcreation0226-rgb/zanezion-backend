import { z } from 'zod';

export const createVendorSchema = z.object({
  vendorCode: z.string().min(2).max(20).nullable().optional(),
  companyName: z.string().min(2).max(150).nullable().optional(),
  name: z.string().nullable().optional(),
  contactPerson: z.string().nullable().optional(),
  contact: z.string().nullable().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  category: z.string().nullable().optional(),
  rating: z.number().int().min(0).max(100).nullable().optional(),
  delivery: z.number().int().min(0).max(100).nullable().optional()
});

export const updateVendorSchema = z.object({
  vendorCode: z.string().min(2).max(20).nullable().optional(),
  companyName: z.string().min(2).max(150).nullable().optional(),
  name: z.string().nullable().optional(),
  contactPerson: z.string().nullable().optional(),
  contact: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  category: z.string().nullable().optional(),
  rating: z.number().int().min(0).max(100).nullable().optional(),
  delivery: z.number().int().min(0).max(100).nullable().optional()
});
