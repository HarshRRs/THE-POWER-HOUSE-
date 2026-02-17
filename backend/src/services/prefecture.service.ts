import { prisma } from '../config/database.js';
import type { PrefectureStatus } from '@prisma/client';

import { ALL_PREFECTURES } from '../scraper/prefectures/index.js';

export async function getAllPrefectures() {
  try {
    const prefectures = await prisma.prefecture.findMany({
      orderBy: [
        { tier: 'asc' },
        { name: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        department: true,
        region: true,
        tier: true,
        status: true,
        lastScrapedAt: true,
        lastSlotFoundAt: true,
        _count: {
          select: {
            alerts: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (prefectures.length === 0) {
      throw new Error("No prefectures found in database");
    }

    return prefectures;
  } catch (error) {
    console.warn("Database error or empty, returning mock prefectures");
    return ALL_PREFECTURES.map(p => ({
      id: p.id,
      name: p.name,
      department: p.department,
      region: p.region,
      tier: p.tier,
      status: 'ACTIVE',
      lastScrapedAt: new Date(),
      lastSlotFoundAt: null,
      _count: { alerts: 0 }
    }));
  }
}

export async function getPrefectureById(prefectureId: string) {
  const prefecture = await prisma.prefecture.findUnique({
    where: { id: prefectureId },
    include: {
      _count: {
        select: {
          alerts: { where: { isActive: true } },
          detections: true,
        },
      },
    },
  });

  return prefecture;
}

export async function getPrefecturesByTier(tier: number) {
  const prefectures = await prisma.prefecture.findMany({
    where: { tier },
    orderBy: { name: 'asc' },
  });

  return prefectures;
}

export async function updatePrefectureStatus(
  prefectureId: string,
  status: PrefectureStatus,
  _error?: string
) {
  const updateData: {
    status: PrefectureStatus;
    consecutiveErrors?: number;
    lastScrapedAt: Date;
  } = {
    status,
    lastScrapedAt: new Date(),
  };

  if (status === 'ERROR' || status === 'CAPTCHA') {
    await prisma.prefecture.update({
      where: { id: prefectureId },
      data: {
        ...updateData,
        consecutiveErrors: { increment: 1 },
      },
    });
  } else if (status === 'ACTIVE') {
    await prisma.prefecture.update({
      where: { id: prefectureId },
      data: {
        ...updateData,
        consecutiveErrors: 0,
      },
    });
  }
}

export async function recordSlotFound(prefectureId: string) {
  await prisma.prefecture.update({
    where: { id: prefectureId },
    data: {
      lastSlotFoundAt: new Date(),
      consecutiveErrors: 0,
      status: 'ACTIVE',
    },
  });
}

export async function getActivePrefecturesWithAlerts() {
  const prefectures = await prisma.prefecture.findMany({
    where: {
      status: 'ACTIVE',
      alerts: {
        some: {
          isActive: true,
          user: {
            plan: { not: 'NONE' },
            planExpiresAt: { gt: new Date() },
          },
        },
      },
    },
    include: {
      alerts: {
        where: {
          isActive: true,
          user: {
            plan: { not: 'NONE' },
            planExpiresAt: { gt: new Date() },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              telegramChatId: true,
              fcmTokens: true,
              notifyEmail: true,
              notifyTelegram: true,
              notifySms: true,
              notifyFcm: true,
              plan: true,
            },
          },
        },
      },
    },
  });

  return prefectures;
}

export async function getRecentDetections(prefectureId: string, limit = 10) {
  const detections = await prisma.detection.findMany({
    where: { prefectureId },
    orderBy: { detectedAt: 'desc' },
    take: limit,
  });

  return detections;
}
