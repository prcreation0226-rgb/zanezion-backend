import { z } from 'zod';

export const createNotificationSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    message: z.string().min(1, 'Message is required'),
    type: z.string().min(1, 'Type is required'),
    userId: z.number().int().positive('User ID is required'),
  }),
});
