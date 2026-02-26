import { prisma } from '../config/database.js';
import type { ConsulateStatus } from '@prisma/client';

export async function getAllConsulates() {
  return prisma.consulate.findMany({
    include: {
      _count: {
        select: {
          alerts: true,
          detections: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getConsulateById(id: string) {
  return prisma.consulate.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          alerts: true,
          detections: true,
        },
      },
    },
  });
}

export async function updateConsulateStatus(
  id: string,
  status: ConsulateStatus
): Promise<void> {
  await prisma.consulate.update({
    where: { id },
    data: {
      status,
      consecutiveErrors: status === 'ACTIVE' ? 0 : undefined,
    },
  });
}

export async function getConsulateDetections(consulateId: string, limit = 10) {
  return prisma.detection.findMany({
    where: { consulateId },
    include: {
      consulate: {
        select: {
          name: true,
          country: true,
          city: true,
        },
      },
    },
    orderBy: { detectedAt: 'desc' },
    take: limit,
  });
}
