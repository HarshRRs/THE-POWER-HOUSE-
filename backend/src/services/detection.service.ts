import { prisma } from '../config/database.js';
import type { ScrapeResult } from '../types/prefecture.types.js';
import type { SlotDetectionData } from '../types/notification.types.js';
import { dispatchSlotNotifications } from './notifications/notification.service.js';
import { recordSlotFound } from './prefecture.service.js';
import { deduplicationService } from './deduplication.service.js';
import logger from '../utils/logger.util.js';
import type { Plan } from '@prisma/client';

interface AlertWithUser {
  id: string;
  user: {
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
    planExpiresAt: Date | null;
  };
}

export async function processDetection(
  prefectureId: string,
  result: ScrapeResult,
  alertIds: string[]
): Promise<void> {
  if (result.status !== 'slots_found' || result.slotsAvailable === 0) {
    return;
  }

  // Get prefecture info
  const prefecture = await prisma.prefecture.findUnique({
    where: { id: prefectureId },
    select: { name: true, department: true },
  });

  if (!prefecture) {
    logger.error(`Prefecture ${prefectureId} not found`);
    return;
  }

  // Create detections for each alert
  const detectionData = {
    prefectureId,
    slotsAvailable: result.slotsAvailable,
    slotDate: result.slotDate,
    slotTime: result.slotTime,
    bookingUrl: result.bookingUrl,
    screenshotPath: result.screenshotPath,
  };

  // Get alerts with user info
  const alerts = await prisma.alert.findMany({
    where: {
      id: { in: alertIds },
      isActive: true,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          phone: true,
          whatsappNumber: true,
          telegramChatId: true,
          fcmTokens: true,
          notifyEmail: true,
          notifyWhatsapp: true,
          notifyTelegram: true,
          notifySms: true,
          notifyFcm: true,
          plan: true,
          planExpiresAt: true,
        },
      },
    },
  }) as AlertWithUser[];

  // Filter to only active paying users
  const activeAlerts = alerts.filter(
    (alert) =>
      alert.user.plan !== 'NONE' &&
      alert.user.planExpiresAt &&
      alert.user.planExpiresAt > new Date()
  );

  if (activeAlerts.length === 0) {
    logger.debug(`No active paying users for detection in ${prefectureId}`);
    return;
  }

  // Deduplication: Filter out alerts that have already received this notification
  const nonDuplicateAlerts: AlertWithUser[] = [];
  
  for (const alert of activeAlerts) {
    const isNew = await deduplicationService.checkAndMark({
      prefectureId,
      alertId: alert.id,
      slotDate: result.slotDate,
      slotTime: result.slotTime,
    });

    if (isNew) {
      nonDuplicateAlerts.push(alert);
    } else {
      logger.debug(`Skipping duplicate notification for alert ${alert.id}`);
    }
  }

  if (nonDuplicateAlerts.length === 0) {
    logger.debug(`All ${activeAlerts.length} alerts were duplicates for ${prefectureId}`);
    return;
  }

  logger.info(
    `Deduplication: ${nonDuplicateAlerts.length}/${activeAlerts.length} alerts are new for ${prefectureId}`
  );

  // Create detection records only for non-duplicates
  await prisma.detection.createMany({
    data: nonDuplicateAlerts.map((alert) => ({
      alertId: alert.id,
      ...detectionData,
    })),
  });

  // Update alert stats only for non-duplicates
  await prisma.alert.updateMany({
    where: { id: { in: nonDuplicateAlerts.map((a) => a.id) } },
    data: {
      slotsFound: { increment: result.slotsAvailable },
      notificationsSent: { increment: 1 },
      lastCheckedAt: new Date(),
    },
  });

  // Update prefecture last slot found
  await recordSlotFound(prefectureId);

  // Prepare notification data
  const slotData: SlotDetectionData = {
    prefectureId,
    prefectureName: prefecture.name,
    department: prefecture.department,
    slotsAvailable: result.slotsAvailable,
    bookingUrl: result.bookingUrl,
    slotDate: result.slotDate,
    slotTime: result.slotTime,
    screenshotPath: result.screenshotPath,
  };

  // Dispatch notifications only to non-duplicate users
  const users = nonDuplicateAlerts.map((alert) => alert.user);
  await dispatchSlotNotifications(users, slotData);

  logger.info(
    `Detection processed: ${result.slotsAvailable} slots at ${prefecture.name}, ` +
    `notifying ${users.length} users`
  );
}

export async function getUserDetections(userId: string, limit = 20) {
  return prisma.detection.findMany({
    where: {
      alert: { userId },
    },
    include: {
      prefecture: {
        select: {
          name: true,
          department: true,
        },
      },
    },
    orderBy: { detectedAt: 'desc' },
    take: limit,
  });
}

export async function getRecentDetectionsCount(hours = 24): Promise<number> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return prisma.detection.count({
    where: { detectedAt: { gte: since } },
  });
}
