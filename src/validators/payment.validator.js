import { z } from 'zod';

export const receivePaymentSchema = z.object({
  invoiceId: z.number().int().positive('Invoice ID is required'),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'cheque', 'credit_card'], { required_error: 'Valid payment method is required' }),
  referenceNumber: z.string().optional(),
  amount: z.number().positive('Payment amount must be greater than zero'),
  remarks: z.string().optional()
});
