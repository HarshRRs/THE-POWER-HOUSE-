import { prisma } from '../config/database.js';
import { PLAN_LIMITS } from '../config/constants.js';
import type { Plan, Prisma } from '@prisma/client';
import logger from '../utils/logger.util.js';

type TransactionClient = Prisma.TransactionClient;

export async function activatePlan(userId: string, plan: Plan, tx?: TransactionClient): Promise<void> {
  const client = tx || prisma;
  const planConfig = PLAN_LIMITS[plan];
  const expiresAt = new Date(Date.now() + planConfig.duration);

  await client.user.update({
    where: { id: userId },
    data: {
      plan,
      planExpiresAt: expiresAt,
    },
  });

  logger.info(`Plan ${plan} activated for user ${userId}, expires at ${expiresAt.toISOString()}`);
}

export async function expirePlans(): Promise<number> {
  const now = new Date();

  // Find and expire all plans that have passed their expiration
  const result = await prisma.user.updateMany({
    where: {
      plan: { not: 'NONE' },
      planExpiresAt: { lt: now },
    },
    data: {
      plan: 'NONE',
      planExpiresAt: null,
    },
  });

  if (result.count > 0) {
    // Deactivate all alerts for expired users
    await prisma.alert.updateMany({
      where: {
        user: { plan: 'NONE' },
      },
      data: { isActive: false },
    });

    logger.info(`Expired ${result.count} plans and deactivated their alerts`);
  }

  return result.count;
}

export async function renewSubscription(userId: string, tx?: TransactionClient): Promise<void> {
  const client = tx || prisma;
  const user = await client.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.plan !== 'URGENCE_TOTAL') {
    return;
  }

  const planConfig = PLAN_LIMITS.URGENCE_TOTAL;
  const expiresAt = new Date(Date.now() + planConfig.duration);

  await client.user.update({
    where: { id: userId },
    data: {
      planExpiresAt: expiresAt,
    },
  });

  logger.info(`Subscription renewed for user ${userId}, expires at ${expiresAt.toISOString()}`);
}

export async function cancelSubscription(userId: string, tx?: TransactionClient): Promise<void> {
  const client = tx || prisma;
  
  await client.user.update({
    where: { id: userId },
    data: {
      plan: 'NONE',
      planExpiresAt: null,
    },
  });

  // Deactivate all alerts
  await client.alert.updateMany({
    where: { userId },
    data: { isActive: false },
  });

  logger.info(`Subscription cancelled for user ${userId}`);
}

export function getPlanConfig(plan: Plan) {
  return PLAN_LIMITS[plan];
}

export function isPlanActive(plan: Plan, expiresAt: Date | null): boolean {
  if (plan === 'NONE') return false;
  if (!expiresAt) return false;
  return expiresAt > new Date();
}
