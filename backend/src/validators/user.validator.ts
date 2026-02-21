import { z } from 'zod';

export const updateProfileSchema = z.object({
  phone: z.string().optional().nullable(),
  whatsappNumber: z.string().optional().nullable(),
  telegramChatId: z.string().optional().nullable(),
});

export const updateNotificationPrefsSchema = z.object({
  notifyEmail: z.boolean().optional(),
  notifyWhatsapp: z.boolean().optional(),
  notifyTelegram: z.boolean().optional(),
  notifySms: z.boolean().optional(),
  notifyFcm: z.boolean().optional(),
});

export const updateFcmTokenSchema = z.object({
  token: z.string().min(1, 'FCM token is required'),
  action: z.enum(['add', 'remove']),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateNotificationPrefsInput = z.infer<typeof updateNotificationPrefsSchema>;
export type UpdateFcmTokenInput = z.infer<typeof updateFcmTokenSchema>;
