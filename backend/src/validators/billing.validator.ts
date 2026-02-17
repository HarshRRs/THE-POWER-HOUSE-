import { z } from 'zod';
import { Plan } from '@prisma/client';

const planValues = Object.values(Plan).filter(p => p !== 'NONE') as [string, ...string[]];

export const createCheckoutSchema = z.object({
  plan: z.enum(planValues),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
