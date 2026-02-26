import { prisma } from '../config/database.js';
import type { VfsCenter, VfsCenterStatus, Procedure } from '@prisma/client';
import { getAllVfsConfigs, getVfsConfig } from '../scraper/vfs/index.js';
import logger from '../utils/logger.util.js';

// System user ID for VFS alerts (set via env or uses first admin)
const SYSTEM_USER_ID = process.env.SYSTEM_USER_ID;

/**
 * Get or create system user for VFS alerts
 */
async function getSystemUserId(): Promise<string> {
  if (SYSTEM_USER_ID) {
    return SYSTEM_USER_ID;
  }
  
  // Find or create admin user
  let adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  });
  
  if (!adminUser) {
    // Create a system user if no admin exists
    adminUser = await prisma.user.create({
      data: {
        email: 'system@rdvpriority.fr',
        passwordHash: 'system-no-login',
        role: 'ADMIN',
        plan: 'URGENCE_TOTAL',
        emailVerified: true,
      },
      select: { id: true },
    });
    logger.info(`Created system user: ${adminUser.id}`);
  }
  
  return adminUser.id;
}

/**
 * Get all VFS centers
 */
export async function getAllVfsCenters(): Promise<VfsCenter[]> {
  return prisma.vfsCenter.findMany({
    orderBy: [
      { destinationCountry: 'asc' },
      { city: 'asc' },
    ],
  });
}

/**
 * Get VFS centers by destination country
 */
export async function getVfsCentersByCountry(country: string): Promise<VfsCenter[]> {
  return prisma.vfsCenter.findMany({
    where: { destinationCountry: country },
    orderBy: { city: 'asc' },
  });
}

/**
 * Get VFS centers by config ID
 */
export async function getVfsCentersByConfig(configId: string): Promise<VfsCenter[]> {
  return prisma.vfsCenter.findMany({
    where: { configId },
    orderBy: { city: 'asc' },
  });
}

/**
 * Get active VFS centers
 */
export async function getActiveVfsCenters(): Promise<VfsCenter[]> {
  return prisma.vfsCenter.findMany({
    where: { status: 'ACTIVE' },
    orderBy: [
      { destinationCountry: 'asc' },
      { city: 'asc' },
    ],
  });
}

/**
 * Get a single VFS center by ID
 */
export async function getVfsCenterById(id: string): Promise<VfsCenter | null> {
  return prisma.vfsCenter.findUnique({ where: { id } });
}

/**
 * Update VFS center status
 */
export async function updateVfsCenterStatus(
  id: string,
  status: VfsCenterStatus,
  errorCount?: number
): Promise<VfsCenter> {
  const data: { status: VfsCenterStatus; consecutiveErrors?: number } = { status };
  
  if (errorCount !== undefined) {
    data.consecutiveErrors = errorCount;
  }
  
  if (status === 'ACTIVE') {
    data.consecutiveErrors = 0;
  }
  
  return prisma.vfsCenter.update({
    where: { id },
    data,
  });
}

/**
 * Update VFS center after scrape
 */
export async function updateVfsCenterAfterScrape(
  id: string,
  success: boolean,
  slotsFound: boolean
): Promise<VfsCenter> {
  const now = new Date();
  
  if (success) {
    return prisma.vfsCenter.update({
      where: { id },
      data: {
        lastScrapedAt: now,
        lastSlotFoundAt: slotsFound ? now : undefined,
        consecutiveErrors: 0,
        status: 'ACTIVE',
      },
    });
  }
  
  // Increment error count
  const center = await prisma.vfsCenter.findUnique({ where: { id } });
  const newErrorCount = (center?.consecutiveErrors || 0) + 1;
  
  // Set to ERROR status after 5 consecutive failures
  const newStatus: VfsCenterStatus = newErrorCount >= 5 ? 'ERROR' : 'ACTIVE';
  
  return prisma.vfsCenter.update({
    where: { id },
    data: {
      lastScrapedAt: now,
      consecutiveErrors: newErrorCount,
      status: newStatus,
    },
  });
}

/**
 * Get VFS centers with active alerts
 */
export async function getVfsCentersWithActiveAlerts(): Promise<VfsCenter[]> {
  return prisma.vfsCenter.findMany({
    where: {
      status: 'ACTIVE',
      alerts: {
        some: {
          isActive: true,
        },
      },
    },
    orderBy: { destinationCountry: 'asc' },
  });
}

/**
 * Sync VFS centers from config to database
 * Creates new centers if they don't exist
 */
export async function syncVfsCentersFromConfig(): Promise<{ created: number; updated: number }> {
  const configs = getAllVfsConfigs();
  let created = 0;
  let updated = 0;

  for (const config of configs) {
    for (const center of config.centers) {
      const centerId = `${config.id}-${center.id}`;
      
      const existingCenter = await prisma.vfsCenter.findUnique({
        where: { id: centerId },
      });

      if (existingCenter) {
        // Update if needed
        await prisma.vfsCenter.update({
          where: { id: centerId },
          data: {
            name: `VFS ${config.destinationCountry} - ${center.name}`,
            bookingUrl: config.appointmentUrl,
            checkInterval: Math.floor(config.checkInterval / 1000), // Convert to seconds
          },
        });
        updated++;
      } else {
        // Create new center
        await prisma.vfsCenter.create({
          data: {
            id: centerId,
            configId: config.id,
            name: `VFS ${config.destinationCountry} - ${center.name}`,
            destinationCountry: config.destinationCountry,
            sourceCountry: config.sourceCountry,
            city: center.city,
            centerCode: center.code,
            bookingUrl: config.appointmentUrl,
            checkInterval: Math.floor(config.checkInterval / 1000), // Convert to seconds
            status: 'ACTIVE',
          },
        });
        created++;
      }
    }
  }

  logger.info(`VFS centers sync complete: ${created} created, ${updated} updated`);
  return { created, updated };
}

/**
 * Get VFS center statistics
 */
export async function getVfsCenterStats(): Promise<{
  total: number;
  active: number;
  error: number;
  captchaBlocked: number;
  paused: number;
  byCountry: Record<string, number>;
}> {
  const [total, active, error, captchaBlocked, paused, byCountryRaw] = await Promise.all([
    prisma.vfsCenter.count(),
    prisma.vfsCenter.count({ where: { status: 'ACTIVE' } }),
    prisma.vfsCenter.count({ where: { status: 'ERROR' } }),
    prisma.vfsCenter.count({ where: { status: 'CAPTCHA_BLOCKED' } }),
    prisma.vfsCenter.count({ where: { status: 'PAUSED' } }),
    prisma.vfsCenter.groupBy({
      by: ['destinationCountry'],
      _count: { id: true },
    }),
  ]);

  const byCountry: Record<string, number> = {};
  for (const item of byCountryRaw) {
    byCountry[item.destinationCountry] = item._count.id;
  }

  return { total, active, error, captchaBlocked, paused, byCountry };
}

/**
 * Create VFS alerts for a client
 * Creates alerts for each combination of center + category
 */
export async function createVfsAlerts(params: {
  clientName: string;
  clientEmail?: string | null;
  configId: string;
  centerIds: string[];
  categoryIds: string[];
}): Promise<{ alertsCreated: number; alertIds: string[] }> {
  const { clientName, clientEmail, configId, centerIds, categoryIds } = params;
  
  const config = getVfsConfig(configId);
  if (!config) {
    throw new Error(`VFS config not found: ${configId}`);
  }

  const systemUserId = await getSystemUserId();
  const alertIds: string[] = [];
  let alertsCreated = 0;

  // Build VFS center IDs (compound: configId-centerId)
  const vfsCenterIds = centerIds.map(cid => `${configId}-${cid}`);
  
  // Ensure VFS centers exist in database
  for (const vfsCenterId of vfsCenterIds) {
    const center = config.centers.find(c => `${configId}-${c.id}` === vfsCenterId);
    if (!center) continue;
    
    const existingCenter = await prisma.vfsCenter.findUnique({
      where: { id: vfsCenterId },
    });
    
    if (!existingCenter) {
      // Create the VFS center if it doesn't exist
      await prisma.vfsCenter.create({
        data: {
          id: vfsCenterId,
          configId: config.id,
          name: `VFS ${config.destinationCountry} - ${center.name}`,
          destinationCountry: config.destinationCountry,
          sourceCountry: config.sourceCountry,
          city: center.city,
          centerCode: center.code,
          bookingUrl: config.appointmentUrl,
          checkInterval: Math.floor(config.checkInterval / 1000),
          status: 'ACTIVE',
        },
      });
      logger.info(`Auto-created VFS center: ${vfsCenterId}`);
    }
  }

  // Create alerts for each center + category combination
  for (const vfsCenterId of vfsCenterIds) {
    for (const categoryId of categoryIds) {
      const category = config.visaCategories.find(c => c.id === categoryId);
      if (!category || category.procedures.length === 0) continue;
      
      // Use the first procedure from the category
      const procedure = category.procedures[0] as Procedure;
      
      // Check if alert already exists
      const existingAlert = await prisma.alert.findFirst({
        where: {
          userId: systemUserId,
          vfsCenterId,
          procedure,
        },
      });

      if (existingAlert) {
        // Reactivate if inactive
        if (!existingAlert.isActive) {
          await prisma.alert.update({
            where: { id: existingAlert.id },
            data: { isActive: true },
          });
        }
        alertIds.push(existingAlert.id);
        continue;
      }

      // Create new alert
      const alert = await prisma.alert.create({
        data: {
          userId: systemUserId,
          targetType: 'VFS_CENTER',
          vfsCenterId,
          procedure,
          isActive: true,
        },
      });
      
      alertIds.push(alert.id);
      alertsCreated++;
      
      logger.info(
        `Created VFS alert for ${clientName}: ${vfsCenterId} / ${category.name} (${alert.id})`
      );
    }
  }

  // Log the client info (for tracking who requested what)
  logger.info(
    `VFS alerts batch: ${clientName} ${clientEmail || ''} - ${alertsCreated} new alerts, ${alertIds.length} total`
  );

  return { alertsCreated, alertIds };
}

/**
 * Get VFS alerts (for boss panel display)
 */
export async function getVfsAlerts() {
  return prisma.alert.findMany({
    where: {
      targetType: 'VFS_CENTER',
      vfsCenterId: { not: null },
    },
    select: {
      id: true,
      vfsCenterId: true,
      procedure: true,
      isActive: true,
      lastCheckedAt: true,
      slotsFound: true,
      vfsCenter: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}
