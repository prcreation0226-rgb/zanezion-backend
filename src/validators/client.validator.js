import { z } from 'zod';

export const createClientSchema = z.object({
  clientCode: z.string().optional(),
  companyName: z.string().optional().or(z.literal('')),
  name: z.string().optional().or(z.literal('')),
  contactPerson: z.string().optional().or(z.literal('')),
  contact: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email address').nullable().optional().or(z.literal('')),
  phone: z.string().nullable().optional().or(z.literal('')),
  address: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  clientType: z.string().nullable().optional(),
  client_type: z.string().nullable().optional(),
  billingCycle: z.string().nullable().optional(),
  paymentMethod: z.string().nullable().optional(),
  plan: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  tenantId: z.number().nullable().optional(),
  password: z.string().nullable().optional()
});

export const updateClientSchema = z.object({
  companyName: z.string().min(2).optional().or(z.literal('')),
  name: z.string().optional().or(z.literal('')),
  contactPerson: z.string().min(2).optional().or(z.literal('')),
  contact: z.string().optional().or(z.literal('')),
  email: z.string().email().nullable().optional().or(z.literal('')),
  phone: z.string().min(5).nullable().optional().or(z.literal('')),
  address: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  clientType: z.string().nullable().optional(),
  client_type: z.string().nullable().optional(),
  billingCycle: z.string().nullable().optional(),
  paymentMethod: z.string().nullable().optional(),
  plan: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  tenantId: z.number().nullable().optional(),
  password: z.string().nullable().optional()
});

export const createClientContactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  designation: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  isPrimary: z.boolean().optional().default(false)
});
