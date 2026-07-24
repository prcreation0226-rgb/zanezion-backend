import { z } from 'zod';

export const updateSettingSchema = z.object({
  body: z.object({
    value: z.string().min(1, 'Value is required'),
  }),
});
