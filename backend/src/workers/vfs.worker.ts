import { createWorker, vfsQueue, notificationQueue } from '../config/bullmq.js';
import { prisma } from '../config/database.js';
import { scrapeVfs, cleanupIdleBrowser, closeBrowser } from '../scraper/vfs/index.js';
import { getVfsConfig } from '../scraper/vfs/vfs.config.js';
import { updateVfsCenterAfterScrape } from '../services/vfs.service.js';
import { handleSlotDetected } from '../booking/index.js';
import { VFS_CONFIG } from '../config/constants.js';
import logger from '../utils/logger.util.js';
import type { VfsScrapeJobData } from '../types/vfs.types.js';

/**
 * Process VFS detection and create alerts
 */
async function processVfsDetection(
  vfsCenterId: string,
  result: Awaited<ReturnType<typeof scrapeVfs>>,
  alertIds: string[],
  procedures?: string[]
): Promise<void> {
  // Create detection record
  for (const alertId of alertIds) {
    await prisma.detection.create({
      data: {
        alertId,
        vfsCenterId,
        slotsAvailable: result.slotsAvailable,
        slotDate: result.availableDates[0]?.date || null,
        slotTime: result.availableDates[0]?.slots[0] || null,
        bookingUrl: result.bookingUrl,
        screenshotPath: result.screenshotPath,
      },
    });

    // Update alert stats
    await prisma.alert.update({
      where: { id: alertId },
      data: {
        slotsFound: { increment: result.slotsAvailable },
        lastCheckedAt: new Date(),
      },
    });
  }

  // Queue notifications for all alerts
  // (notification queue will handle deduplication)
  const alerts = await prisma.alert.findMany({
    where: { id: { in: alertIds } },
    include: { user: true, vfsCenter: true },
  });

  for (const alert of alerts) {
    // Get the VFS config for additional info
    const center = await prisma.vfsCenter.findUnique({ where: { id: vfsCenterId } });
    
    logger.info(
      `VFS SLOTS DETECTED: ${result.slotsAvailable} slots at ${center?.name || vfsCenterId} for user ${alert.userId}`
    );
    
    // Queue notification job for each alert
    await notificationQueue.add(
      `vfs-slot-alert:${alert.id}`,
      {
        userId: alert.userId,
        channel: 'EMAIL',
        type: 'slot_detected',
        title: `VFS Appointment Available - ${center?.name || vfsCenterId}`,
        body: `${result.slotsAvailable} slot(s) found at ${center?.name || vfsCenterId}. Dates: ${result.availableDates.map(d => d.date).join(', ')}`,
        metadata: {
          alertId: alert.id,
          vfsCenterId,
          slotsAvailable: result.slotsAvailable,
          availableDates: result.availableDates,
          bookingUrl: result.bookingUrl,
        },
      },
      { priority: 1 }
    );
  }

  // Trigger auto-booking for matching clients
  if (result.slotsAvailable > 0 && procedures && procedures.length > 0) {
    try {
      await handleSlotDetected({
        system: 'VFS',
        vfsCenterId,
        procedure: procedures[0],
        date: result.availableDates[0]?.date || new Date().toISOString().split('T')[0],
        time: result.availableDates[0]?.slots[0],
        slotsAvailable: result.slotsAvailable,
      });
    } catch (err) {
      logger.error(`Auto-booking trigger failed for ${vfsCenterId}:`, err);
    }
  }
}

export async function startVfsWorker(workerId: string, concurrency = 1) {
  logger.info(`Starting VFS worker ${workerId} with concurrency ${concurrency}`);

  const worker = createWorker<VfsScrapeJobData>(
    'vfs',
    async (job) => {
      const { configId, centerId, categoryId } = job.data;
      const vfsCenterId = `${configId}-${centerId}`;

      try {
        const config = getVfsConfig(configId);
        if (!config) {
          logger.error(`VFS config not found: ${configId}`);
          return;
        }

        // Check if VFS center is active in DB
        const vfsCenter = await prisma.vfsCenter.findUnique({
          where: { id: vfsCenterId },
          select: { status: true, consecutiveErrors: true },
        });

        if (!vfsCenter || vfsCenter.status !== 'ACTIVE') {
          logger.debug(`Skipping VFS ${vfsCenterId}: status is ${vfsCenter?.status}`);
          return;
        }

        // Find the category config to get matching procedures
        const category = config.visaCategories.find((c) => c.id === categoryId);
        if (!category) {
          logger.error(`VFS category ${categoryId} not found for ${configId}`);
          return;
        }

        // Get active alerts for this VFS center + matching procedures
        const alerts = await prisma.alert.findMany({
          where: {
            vfsCenterId,
            isActive: true,
            procedure: { in: category.procedures },
            user: {
              plan: { not: 'NONE' },
              planExpiresAt: { gt: new Date() },
            },
          },
          select: { id: true },
        });

        if (alerts.length === 0) {
          logger.debug(`No active alerts for VFS ${vfsCenterId}/${category.name}, skipping`);
          return;
        }

        // Run the scraper
        const result = await scrapeVfs(configId, centerId, categoryId);

        // Handle result
        if (result.status === 'slots_found') {
          await processVfsDetection(
            vfsCenterId,
            result,
            alerts.map((a) => a.id),
            category.procedures
          );
          await updateVfsCenterAfterScrape(vfsCenterId, true, true);
        } else if (result.status === 'captcha_blocked') {
          // Mark as CAPTCHA blocked
          await prisma.vfsCenter.update({
            where: { id: vfsCenterId },
            data: {
              status: 'CAPTCHA_BLOCKED',
              lastScrapedAt: new Date(),
            },
          });
          logger.warn(`VFS ${vfsCenterId} blocked by CAPTCHA`);
        } else if (result.status === 'error' || result.status === 'timeout') {
          await updateVfsCenterAfterScrape(vfsCenterId, false, false);
          
          const newErrorCount = (vfsCenter.consecutiveErrors || 0) + 1;
          if (newErrorCount >= VFS_CONFIG.maxConsecutiveErrors) {
            logger.error(`VFS ${vfsCenterId} marked as ERROR after ${newErrorCount} consecutive errors`);
          }
        } else {
          // no_slots - reset error count
          await updateVfsCenterAfterScrape(vfsCenterId, true, false);
        }

        logger.debug(
          `Scraped VFS ${vfsCenterId}/${category.name}: ${result.status}, ${result.slotsAvailable} slots, ${result.responseTimeMs}ms`
        );
      } catch (error) {
        logger.error(`VFS scraper job error for ${configId}/${centerId}/${categoryId}:`, error);
        throw error;
      }
    },
    concurrency
  );

  if (worker) {
    worker.on('completed', (job) => {
      logger.debug(`VFS job ${job.id} completed`);
    });

    worker.on('failed', (job, error) => {
      logger.error(`VFS job ${job?.id} failed:`, error);
    });
  }

  // Set up periodic browser cleanup
  setInterval(async () => {
    await cleanupIdleBrowser();
  }, 60 * 1000); // Check every minute

  return worker;
}

export async function scheduleVfsJobs() {
  logger.info('Scheduling VFS jobs...');

  const vfsCenters = await prisma.vfsCenter.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, configId: true, checkInterval: true },
  });

  let scheduledCount = 0;

  for (const center of vfsCenters) {
    const config = getVfsConfig(center.configId);
    if (!config) continue;

    for (const category of config.visaCategories) {
      // Check if any active alerts exist for this VFS center + category procedures
      const alertCount = await prisma.alert.count({
        where: {
          vfsCenterId: center.id,
          isActive: true,
          procedure: { in: category.procedures },
          user: {
            plan: { not: 'NONE' },
            planExpiresAt: { gt: new Date() },
          },
        },
      });

      // Extract centerId from the compound ID (e.g., 'vfs-italy-india-del' -> 'del')
      const centerId = center.id.replace(`${center.configId}-`, '');
      const jobId = `repeat:vfs:${center.id}:${category.id}`;
      const intervalSeconds = center.checkInterval || 300; // Default 5 minutes

      if (alertCount > 0) {
        await vfsQueue.add(
          `scrape:vfs:${center.id}:${category.id}`,
          { configId: center.configId, centerId, categoryId: category.id },
          {
            repeat: { every: intervalSeconds * 1000 },
            jobId,
          }
        );
        scheduledCount++;
        logger.debug(`Scheduled VFS ${center.id}/${category.name} every ${intervalSeconds}s`);
      } else {
        try {
          await vfsQueue.removeRepeatable(
            `scrape:vfs:${center.id}:${category.id}`,
            { every: intervalSeconds * 1000 },
            jobId
          );
          logger.debug(`Removed VFS schedule for ${center.id}/${category.name} (no active alerts)`);
        } catch {
          // Job might not exist
        }
      }
    }
  }

  logger.info(`Scheduled ${scheduledCount} VFS jobs for ${vfsCenters.length} center(s)`);
}

export async function rescheduleVfsJobs() {
  await scheduleVfsJobs();
}

export async function shutdownVfsWorker() {
  await closeBrowser();
}
