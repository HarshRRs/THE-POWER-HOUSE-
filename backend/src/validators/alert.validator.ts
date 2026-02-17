import { z } from 'zod';
import { Procedure } from '@prisma/client';

const procedureValues = Object.values(Procedure) as [string, ...string[]];

export const createAlertSchema = z.object({
  prefectureId: z.string().min(1, 'Prefecture ID is required'),
  procedure: z.enum(procedureValues),
});

export const updateAlertSchema = z.object({
  isActive: z.boolean().optional(),
});

export const alertIdSchema = z.object({
  id: z.string().uuid('Invalid alert ID'),
});

export type CreateAlertInput = z.infer<typeof createAlertSchema>;
export type UpdateAlertInput = z.infer<typeof updateAlertSchema>;
