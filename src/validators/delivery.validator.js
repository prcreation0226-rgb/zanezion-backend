import { z } from 'zod';

const deliveryItemSchema = z.object({
  orderItemId: z.union([z.number(), z.string(), z.null()]).optional().nullable(),
  itemId: z.union([z.number(), z.string(), z.null()]).optional().nullable(),
  name: z.string().optional().nullable(),
  quantity: z.union([z.number(), z.string()]).optional().nullable()
}).passthrough();

export const createDeliverySchema = z.object({
  orderId: z.union([z.number(), z.string(), z.null()]).optional().nullable(),
  warehouseId: z.union([z.number(), z.string(), z.null()]).optional().nullable(),
  clientId: z.union([z.number(), z.string(), z.null()]).optional().nullable(),
  remarks: z.string().optional().nullable(),
  items: z.array(z.any()).optional().nullable(),
  missionType: z.string().optional().nullable(),
  transportMode: z.string().optional().nullable(),
  vehicleRef: z.string().optional().nullable(),
  etaSchedule: z.string().optional().nullable(),
  requestDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  pickupLocation: z.string().optional().nullable(),
  dropLocation: z.string().optional().nullable(),
  routeDistance: z.union([z.number(), z.string()]).optional().nullable(),
  staffPayRate: z.union([z.number(), z.string()]).optional().nullable(),
  deliveryFee: z.union([z.number(), z.string()]).optional().nullable(),
  driver: z.string().optional().nullable(),
  assigned_driver: z.union([z.number(), z.string()]).optional().nullable(),
}).passthrough();
