import { z } from 'zod';
import { Procedure, TargetType } from '@prisma/client';

const procedureValues = Object.values(Procedure) as [string, ...string[]];
const targetTypeValues = Object.values(TargetType) as [string, ...string[]];

export const createAlertSchema = z.object({
  targetType: z.enum(targetTypeValues).default('PREFECTURE'),
  prefectureId: z.string().min(1).optional(),
  consulateId: z.string().min(1).optional(),
  procedure: z.enum(procedureValues),
}).refine(
  (data) =>
    (data.targetType === 'PREFECTURE' && !!data.prefectureId) ||
    (data.targetType === 'CONSULATE' && !!data.consulateId),
  { message: 'Must provide prefectureId or consulateId matching targetType' }
);

export const updateAlertSchema = z.object({
  isActive: z.boolean().optional(),
});

export const alertIdSchema = z.object({
  id: z.string().uuid('Invalid alert ID'),
});

export type CreateAlertInput = z.infer<typeof createAlertSchema>;
export type UpdateAlertInput = z.infer<typeof updateAlertSchema>;
