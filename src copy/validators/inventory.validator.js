import { z } from 'zod';

export const issueStockSchema = z.object({
  warehouseId: z.number().int().positive('Warehouse ID is required'),
  itemId: z.number().int().positive('Item ID is required'),
  quantity: z.number().positive('Quantity must be positive'),
  issuedBy: z.string().min(1, 'Officer name is required'),
  issuedTo: z.string().min(1, 'Recipient name is required'),
  clientId: z.number().optional().nullable(),
  remarks: z.string().optional()
});

export const recordLossSchema = z.object({
  warehouseId: z.number().int().positive('Warehouse ID is required'),
  itemId: z.number().int().positive('Item ID is required'),
  quantity: z.number().positive('Quantity lost must be positive'),
  lossType: z.enum([
    'Theft',
    'Damage',
    'Expired',
    'Missing During Audit',
    'Destroyed',
    'Lost in Transit',
    'Natural Disaster',
    'Other'
  ], { required_error: 'Loss Type is required' }),
  explanation: z.string().min(1, 'Detailed explanation is required'),
  reportedBy: z.string().min(1, 'Reporter name is required'),
  investigationStatus: z.enum(['Pending', 'Under Investigation', 'Confirmed', 'Closed']).default('Pending'),
  evidenceUrl: z.string().optional().nullable()
});
