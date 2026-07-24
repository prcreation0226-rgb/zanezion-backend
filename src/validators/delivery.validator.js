import { z } from 'zod';

const deliveryItemSchema = z.object({
  orderItemId: z.number().int().positive('Order Item ID is required').optional().nullable(),
  itemId: z.number().int().positive('Item ID is required').optional().nullable(),
  quantity: z.number().positive('Quantity must be positive')
});

export const createDeliverySchema = z.object({
  orderId: z.union([z.number().int().positive(), z.string()]).optional().nullable(),
  warehouseId: z.number().int().positive('Warehouse ID is required').optional().nullable(),
  clientId: z.number().int().positive('Client ID is required').optional().nullable(),
  remarks: z.string().optional(),
  items: z.array(deliveryItemSchema).optional(),
  missionType: z.string().optional().nullable(),
  transportMode: z.string().optional().nullable(),
  vehicleRef: z.string().optional().nullable(),
  etaSchedule: z.string().optional().nullable(),
  requestDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  pickupLocation: z.string().optional().nullable(),
  dropLocation: z.string().optional().nullable(),
  routeDistance: z.number().optional().nullable(),
  staffPayRate: z.number().optional().nullable(),
  deliveryFee: z.number().optional().nullable(),
  driver: z.string().optional().nullable(),
  assigned_driver: z.union([z.number(), z.string()]).optional().nullable(),
});
