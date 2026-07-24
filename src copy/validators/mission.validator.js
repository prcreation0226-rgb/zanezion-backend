import { z } from 'zod';

export const createMissionSchema = z.object({
  deliveryId: z.union([z.number().int().positive(), z.string()]).optional(),
  assignedEmployeeId: z.union([z.number().int().positive(), z.string()]).optional(),
  remarks: z.string().optional()
}).passthrough(); // Allow unknown fields to pass through into metadata


export const submitPODSchema = z.object({
  receiverName: z.string().min(2, 'Receiver Name is required'),
  receiverPhone: z.string().optional(),
  receiverSignature: z.string().optional(),
  deliveryPhoto: z.string().optional(),
  remarks: z.string().optional()
});
