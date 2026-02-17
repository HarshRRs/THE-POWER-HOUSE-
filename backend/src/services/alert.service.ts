import { prisma } from '../config/database.js';
import { PLAN_LIMITS } from '../config/constants.js';
import { ApiError } from '../utils/responses.util.js';
import type { Plan, Procedure } from '@prisma/client';
import type { CreateAlertInput } from '../validators/alert.validator.js';

export async function createAlert(userId: string, userPlan: Plan, input: CreateAlertInput) {
  const { prefectureId, procedure } = input;

  // Check plan limits
  const planConfig = PLAN_LIMITS[userPlan];
  
  if (planConfig.maxAlerts === 0) {
    throw new ApiError('Active plan required to create alerts', 403);
  }

  // Count existing alerts
  const existingAlertCount = await prisma.alert.count({
    where: { userId, isActive: true },
  });

  if (existingAlertCount >= planConfig.maxAlerts) {
    throw new ApiError(`Your plan allows a maximum of ${planConfig.maxAlerts} active alert(s)`, 403);
  }

  // Check if prefecture exists
  const prefecture = await prisma.prefecture.findUnique({
    where: { id: prefectureId },
  });

  if (!prefecture) {
    throw new ApiError('Prefecture not found', 404);
  }

  // Check for duplicate alert
  const existingAlert = await prisma.alert.findUnique({
    where: {
      userId_prefectureId_procedure: {
        userId,
        prefectureId,
        procedure: procedure as Procedure,
      },
    },
  });

  if (existingAlert) {
    throw new ApiError('You already have an alert for this prefecture and procedure', 409);
  }

  const alert = await prisma.alert.create({
    data: {
      userId,
      prefectureId,
      procedure: procedure as Procedure,
    },
    include: {
      prefecture: {
        select: {
          name: true,
          department: true,
          region: true,
        },
      },
    },
  });

  return alert;
}

export async function getUserAlerts(userId: string) {
  const alerts = await prisma.alert.findMany({
    where: { userId },
    include: {
      prefecture: {
        select: {
          name: true,
          department: true,
          region: true,
          tier: true,
          status: true,
        },
      },
      _count: {
        select: {
          detections: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return alerts;
}

export async function getAlertById(alertId: string, userId: string) {
  const alert = await prisma.alert.findFirst({
    where: { id: alertId, userId },
    include: {
      prefecture: true,
      detections: {
        orderBy: { detectedAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!alert) {
    throw new ApiError('Alert not found', 404);
  }

  return alert;
}

export async function toggleAlert(alertId: string, userId: string, isActive?: boolean) {
  const alert = await prisma.alert.findFirst({
    where: { id: alertId, userId },
  });

  if (!alert) {
    throw new ApiError('Alert not found', 404);
  }

  const newStatus = isActive ?? !alert.isActive;

  const updated = await prisma.alert.update({
    where: { id: alertId },
    data: { isActive: newStatus },
    include: {
      prefecture: {
        select: {
          name: true,
          department: true,
        },
      },
    },
  });

  return updated;
}

export async function deleteAlert(alertId: string, userId: string) {
  const alert = await prisma.alert.findFirst({
    where: { id: alertId, userId },
  });

  if (!alert) {
    throw new ApiError('Alert not found', 404);
  }

  await prisma.alert.delete({
    where: { id: alertId },
  });

  return { deleted: true };
}
