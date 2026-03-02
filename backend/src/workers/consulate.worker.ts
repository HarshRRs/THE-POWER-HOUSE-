import { createWorker, consulateQueue } from '../config/bullmq.js';
import { prisma } from '../config/database.js';
import { scrapeConsulate } from '../scraper/consulate.scraper.js';
import { getConsulateConfig } from '../scraper/consulates/index.js';
import { processConsulateDetection } from '../services/detection.service.js';
import { updateConsulateStatus } from '../services/consulate.service.js';
import { CONSULATE_CONFIG } from '../config/constants.js';
import { shouldScrapeConsulate } from '../config/bootstrap.config.js';
import logger from '../utils/logger.util.js';
import type { ConsulateScrapeJobData } from '../types/consulate.types.js';

export async function startConsulateWorker(workerId: string, concurrency = 2) {
  logger.info(`Starting consulate worker ${workerId} with concurrency ${concurrency}`);

  const worker = createWorker<ConsulateScrapeJobData>(
    'consulate',
    async (job) => {
      const { consulateId, categoryId } = job.data;

      try {
        const config = getConsulateConfig(consulateId);
        if (!config) {
          logger.error(`Consulate config not found: ${consulateId}`);
          return;
        }

        // Check if consulate is active in DB
        const consulate = await prisma.consulate.findUnique({
          where: { id: consulateId },
          select: { status: true, consecutiveErrors: true },
        });

        if (!consulate || consulate.status !== 'ACTIVE') {
          logger.debug(`Skipping ${consulateId}: status is ${consulate?.status}`);
          return;
        }

        // Find the category config to get matching procedures
        const category = config.categories.find((c) => c.id === categoryId);
        if (!category) {
          logger.error(`Category ${categoryId} not found for ${consulateId}`);
          return;
        }

        // Get active alerts for this consulate + matching procedures
        const alerts = await prisma.alert.findMany({
          where: {
            consulateId,
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
          // Allow priority consulates to run without alerts for boss panel monitoring
          const isPriority = shouldScrapeConsulate(consulateId, categoryId);
          if (!isPriority) {
            logger.debug(`No active alerts for ${consulateId}/${category.name}, skipping`);
            return;
          }
          logger.debug(`Priority consulate ${consulateId}/${category.name} - scraping without alerts`);
        }

        // Run the scraper
        const result = await scrapeConsulate(config, categoryId);

        // Handle result
        if (result.status === 'slots_found') {
          await processConsulateDetection(
            consulateId,
            result,
            alerts.map((a) => a.id)
          );
          await updateConsulateStatus(consulateId, 'ACTIVE');
        } else if (result.status === 'error' || result.status === 'timeout') {
          const newErrorCount = (consulate.consecutiveErrors || 0) + 1;

          if (newErrorCount >= CONSULATE_CONFIG.maxConsecutiveErrors) {
            await updateConsulateStatus(consulateId, 'ERROR');
            logger.error(`${consulateId} marked as ERROR after ${newErrorCount} consecutive errors`);
          } else {
            await prisma.consulate.update({
              where: { id: consulateId },
              data: { consecutiveErrors: newErrorCount },
            });
          }
        } else {
          // no_slots - reset error count
          await updateConsulateStatus(consulateId, 'ACTIVE');
        }

        // Log to ConsulateScraperLog for boss panel monitoring
        await prisma.consulateScraperLog.create({
          data: {
            consulateId,
            categoryId: category.id,
            categoryName: category.name,
            workerId,
            status: result.status,
            slotsFound: result.slotsAvailable,
            slotDates: result.availableDates ? JSON.stringify(result.availableDates) : null,
            responseTimeMs: result.responseTimeMs,
            errorMessage: result.errorMessage || null,
          },
        });

        // Update last scraped time
        await prisma.consulate.update({
          where: { id: consulateId },
          data: { lastScrapedAt: new Date() },
        });

        logger.debug(
          `Scraped ${consulateId}/${category.name}: ${result.status}, ${result.slotsAvailable} slots, ${result.responseTimeMs}ms`
        );
      } catch (error) {
        logger.error(`Consulate scraper job error for ${consulateId}/${categoryId}:`, error);
        throw error;
      }
    },
    concurrency
  );

  if (worker) {
    worker.on('completed', (job) => {
      logger.debug(`Consulate job ${job.id} completed`);
    });

    worker.on('failed', (job, error) => {
      logger.error(`Consulate job ${job?.id} failed:`, error);
    });
  }

  return worker;
}

export async function scheduleConsulateJobs() {
  logger.info('Scheduling consulate jobs...');

  const consulates = await prisma.consulate.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, checkInterval: true },
  });

  for (const consulate of consulates) {
    const config = getConsulateConfig(consulate.id);
    if (!config) continue;

    for (const category of config.categories) {
      // Check if any active alerts exist for this consulate + category procedures
      const alertCount = await prisma.alert.count({
        where: {
          consulateId: consulate.id,
          isActive: true,
          procedure: { in: category.procedures },
          user: {
            plan: { not: 'NONE' },
            planExpiresAt: { gt: new Date() },
          },
        },
      });

      const jobId = `repeat:${consulate.id}:cat${category.id}`;
      const intervalSeconds = consulate.checkInterval || 60;

      // Schedule if alerts exist OR if it's a priority consulate for boss panel
      const isPriority = shouldScrapeConsulate(consulate.id, category.id);
      if (alertCount > 0 || isPriority) {
        await consulateQueue.add(
          `scrape:${consulate.id}:cat${category.id}`,
          { consulateId: consulate.id, categoryId: category.id },
          {
            repeat: { every: intervalSeconds * 1000 },
            jobId,
          }
        );
        logger.debug(`Scheduled ${consulate.id}/${category.name} every ${intervalSeconds}s${isPriority ? ' (priority)' : ''}`);
      } else {
        try {
          await consulateQueue.removeRepeatable(
            `scrape:${consulate.id}:cat${category.id}`,
            { every: intervalSeconds * 1000 },
            jobId
          );
          logger.debug(`Removed schedule for ${consulate.id}/${category.name} (no active alerts)`);
        } catch {
          // Job might not exist
        }
      }
    }
  }

  logger.info(`Scheduled consulate jobs for ${consulates.length} consulate(s)`);
}

export async function rescheduleConsulateJobs() {
  await scheduleConsulateJobs();
}
