import type { Plan } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { notificationQueue } from '../../config/bullmq.js';
import { PLAN_LIMITS } from '../../config/constants.js';
import { sendEmail } from './email.service.js';
import { sendSms } from './sms.service.js';
import { sendTelegram } from './telegram.service.js';
import { sendWhatsApp } from './whatsapp.service.js';
import { emitSlotDetection } from './websocket.service.js';
import { sendFcm } from './fcm.service.js';
import { TEMPLATES } from './templates.js';
import logger from '../../utils/logger.util.js';
import type { NotificationPayload, SlotDetectionData } from '../../types/notification.types.js';

interface UserNotificationPrefs {
  id: string;
  email: string;
  phone: string | null;
  whatsappNumber: string | null;
  telegramChatId: string | null;
  fcmTokens: string[];
  notifyEmail: boolean;
  notifyWhatsapp: boolean;
  notifyTelegram: boolean;
  notifySms: boolean;
  notifyFcm: boolean;
  plan: Plan;
}

export async function dispatchSlotNotifications(
  users: UserNotificationPrefs[],
  data: SlotDetectionData
): Promise<void> {
  for (const user of users) {
    const planConfig = PLAN_LIMITS[user.plan];
    const allowedChannels = planConfig.channels;

    // Queue notifications for each enabled channel
    if (user.notifyEmail && allowedChannels.includes('EMAIL')) {
      await queueNotification({
        userId: user.id,
        channel: 'EMAIL',
        type: 'slot_detected',
        title: TEMPLATES.slot_detected.email.subject(data),
        body: TEMPLATES.slot_detected.email.html(data),
        metadata: data,
      });
    }

    if (user.notifySms && user.phone && allowedChannels.includes('SMS')) {
      await queueNotification({
        userId: user.id,
        channel: 'SMS',
        type: 'slot_detected',
        title: 'Slot Detected',
        body: TEMPLATES.slot_detected.sms(data),
        metadata: data,
      });
    }

    if (user.notifyWhatsapp && user.whatsappNumber && allowedChannels.includes('WHATSAPP')) {
      await queueNotification({
        userId: user.id,
        channel: 'WHATSAPP',
        type: 'slot_detected',
        title: 'Slot Detected',
        body: TEMPLATES.slot_detected.whatsapp(data),
        metadata: data,
      });
    }

    if (user.notifyTelegram && user.telegramChatId && allowedChannels.includes('TELEGRAM')) {
      await queueNotification({
        userId: user.id,
        channel: 'TELEGRAM',
        type: 'slot_detected',
        title: 'Slot Detected',
        body: TEMPLATES.slot_detected.telegram(data),
        metadata: data,
      });
    }

    // WebSocket is always sent immediately (real-time)
    if (allowedChannels.includes('WEBSOCKET')) {
      emitSlotDetection(user.id, data);
    }

    if (user.notifyFcm && user.fcmTokens.length > 0 && allowedChannels.includes('FCM')) {
      await queueNotification({
        userId: user.id,
        channel: 'FCM',
        type: 'slot_detected',
        title: TEMPLATES.slot_detected.push.title(data),
        body: TEMPLATES.slot_detected.push.body(data),
        metadata: data,
      });
    }
  }
}

export async function queueNotification(payload: NotificationPayload): Promise<void> {
  await notificationQueue.add(`notification:${payload.channel}:${payload.userId}`, payload, {
    priority: payload.type === 'slot_detected' ? 1 : 2, // Slot alerts are high priority
  });
}

export async function processNotification(payload: NotificationPayload): Promise<boolean> {
  const { userId, channel, type, title, body, metadata } = payload;
  let success = false;

  try {
    // Get user info for delivery
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        phone: true,
        whatsappNumber: true,
        telegramChatId: true,
        fcmTokens: true,
      },
    });

    if (!user) {
      logger.error(`User ${userId} not found for notification`);
      return false;
    }

    switch (channel) {
      case 'EMAIL':
        success = await sendEmail({
          to: user.email,
          subject: title,
          html: body,
        });
        break;

      case 'SMS':
        if (user.phone) {
          success = await sendSms({
            to: user.phone,
            body: body,
          });
        }
        break;

      case 'WHATSAPP':
        if (user.whatsappNumber) {
          success = await sendWhatsApp({
            to: user.whatsappNumber,
            message: body,
          });
        }
        break;

      case 'TELEGRAM':
        if (user.telegramChatId) {
          success = await sendTelegram({
            chatId: user.telegramChatId,
            message: body,
          });
        }
        break;

      case 'FCM':
        if (user.fcmTokens.length > 0) {
          const result = await sendFcm({
            tokens: user.fcmTokens,
            title,
            body,
            data: {
              type,
              bookingUrl: metadata.bookingUrl || '',
              prefectureId: metadata.prefectureId || '',
            },
          });
          success = result.success > 0;
        }
        break;

      case 'WEBSOCKET':
        // WebSocket is handled immediately, not queued
        success = true;
        break;
    }

    // Record notification
    await prisma.notification.create({
      data: {
        userId,
        channel,
        type,
        title,
        body,
        metadata: metadata as object,
        status: success ? 'SENT' : 'FAILED',
        sentAt: success ? new Date() : null,
        failedAt: success ? null : new Date(),
        errorMsg: success ? null : 'Delivery failed',
      },
    });

    return success;
  } catch (error) {
    logger.error(`Notification processing error: ${channel} for user ${userId}`, error);
    
    // Record failed notification
    await prisma.notification.create({
      data: {
        userId,
        channel,
        type,
        title,
        body,
        metadata: metadata as object,
        status: 'FAILED',
        failedAt: new Date(),
        errorMsg: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return false;
  }
}

export async function sendWelcomeNotification(_userId: string, email: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: TEMPLATES.welcome.email.subject(),
    html: TEMPLATES.welcome.email.html(),
  });
}

export async function sendPlanActivatedNotification(
  _userId: string, 
  email: string, 
  plan: string
): Promise<void> {
  const metadata = { plan };
  await sendEmail({
    to: email,
    subject: TEMPLATES.plan_activated.email.subject(metadata),
    html: TEMPLATES.plan_activated.email.html(metadata),
  });
}
