import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    tenantId: z.number().int().positive('Tenant ID is required').optional(),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    tenantId: z.number().int().positive('Tenant ID is required'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(6, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    fullName: z.string().min(2).optional(),
    phone: z.string().optional(),
    avatar: z.string().optional(),
    password: z.string().min(6).optional().or(z.literal('')),
    birthday: z.string().nullable().optional(),
    nibNumber: z.string().nullable().optional(),
    bankingInfo: z.object({
      bank: z.string().nullable().optional(),
      account: z.string().nullable().optional(),
      routing: z.string().nullable().optional(),
      method: z.string().nullable().optional(),
    }).optional(),
  }),
});

export const signupSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().optional(),
    accountType: z.enum(['personal', 'business', 'saas']),
    role: z.enum(['customer', 'client', 'saas_client']),
    companyName: z.string().optional(),
  }),
});
