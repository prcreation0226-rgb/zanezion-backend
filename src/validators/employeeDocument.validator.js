import { z } from 'zod';

export const createDocumentSchema = z.object({
  employeeId: z.number().int().positive('Employee ID is required'),
  documentType: z.string().min(2, 'Document type is required'),
  documentNumber: z.string().optional(),
  filePath: z.string().url('Must be a valid URL/Path'),
  expiryDate: z.string().datetime().optional()
});

export const updateDocumentSchema = z.object({
  documentType: z.string().min(2).optional(),
  documentNumber: z.string().optional(),
  filePath: z.string().url().optional(),
  expiryDate: z.string().datetime().optional()
});

export const verifyDocumentSchema = z.object({
  verificationStatus: z.enum(['verified', 'rejected'], { required_error: 'Status must be verified or rejected' })
});
