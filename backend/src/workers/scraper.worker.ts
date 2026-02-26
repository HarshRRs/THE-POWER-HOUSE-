import { createWorker, scraperQueue } from '../config/bullmq.js';
import { prisma } from '../config/database.js';
import { scrapePrefecture } from '../scraper/base.scraper.js';
import { getPrefectureConfig } from '../scraper/prefectures/index.js';
import { processDetection } from '../services/detection.service.js';
import { updatePrefectureStatus } from '../services/prefecture.service.js';
import { sendManualCaptchaAlert } from '../services/manual-captcha.service.js';
import { SCRAPER_CONFIG } from '../config/constants.js';
import { BOOTSTRAP_CONFIG, getEffectiveInterval, shouldScrapePrefecture, logBootstrapStatus } from '../config/bootstrap.config.js';
import logger from '../utils/logger.util.js';
import type { ScrapeJobData } from '../types/prefecture.types.js';

export async function startScraperWorker(workerId: string, concurrency = 3) {
  // Use bootstrap concurrency if enabled
  const effectiveConcurrency = BOOTSTRAP_CONFIG.enabled ? BOOTSTRAP_CONFIG.maxBrowsers : concurrency;
  
  logBootstrapStatus();
  logger.info(`Starting scraper worker ${workerId} with concurrency ${effectiveConcurrency}`);

  const worker = createWorker<ScrapeJobData>(
    'scraper',
    async (job) => {
      const { prefectureId } = job.data;

      // Bootstrap mode: Skip non-priority prefectures
      if (!shouldScrapePrefecture(prefectureId)) {
        logger.debug(`Skipping ${prefectureId}: Not in bootstrap priority list`);
        return;
      }

      try {
        // Get prefecture config
        const config = getPrefectureConfig(prefectureId);
        if (!config) {
          logger.error(`Prefecture config not found: ${prefectureId}`);
          return;
        }

        // Check if prefecture is active in DB
        const prefecture = await prisma.prefecture.findUnique({
          where: { id: prefectureId },
          select: { status: true, consecutiveErrors: true },
        });

        if (!prefecture || prefecture.status !== 'ACTIVE') {
          logger.debug(`Skipping ${prefectureId}: status is ${prefecture?.status}`);
          return;
        }

        // Get active alerts for this prefecture
        const alerts = await prisma.alert.findMany({
          where: {
            prefectureId,
            isActive: true,
            user: {
              plan: { not: 'NONE' },
              planExpiresAt: { gt: new Date() },
            },
          },
          select: { id: true },
        });

        if (alerts.length === 0) {
          logger.debug(`No active alerts for ${prefectureId}, skipping`);
          return;
        }

        // Run the scraper
        const result = await scrapePrefecture(config);

        // Log result
        await prisma.scraperLog.create({
          data: {
            prefectureId,
            workerId,
            status: result.status,
            slotsFound: result.slotsAvailable,
            responseTimeMs: result.responseTimeMs,
            errorMessage: result.errorMessage,
            screenshotPath: result.screenshotPath,
          },
        });

        // Handle result
        if (result.status === 'slots_found') {
          await processDetection(
            prefectureId,
            result,
            alerts.map((a) => a.id)
          );
          await updatePrefectureStatus(prefectureId, 'ACTIVE');
        } else if (result.status === 'captcha') {
          await updatePrefectureStatus(prefectureId, 'CAPTCHA');
          logger.warn(`CAPTCHA detected for ${prefectureId}, pausing`);
          
          // Send manual CAPTCHA alert (bootstrap mode or no auto-solver)
          const prefectureInfo = await prisma.prefecture.findUnique({
            where: { id: prefectureId },
            select: { name: true, bookingUrl: true },
          });
          
          if (prefectureInfo) {
            await sendManualCaptchaAlert({
              prefectureId,
              prefectureName: prefectureInfo.name,
              bookingUrl: prefectureInfo.bookingUrl,
              captchaType: 'detected',
              detectedAt: new Date(),
            });
          }
        } else if (result.status === 'error' || result.status === 'timeout') {
          const newErrorCount = (prefecture.consecutiveErrors || 0) + 1;
          
          if (newErrorCount >= SCRAPER_CONFIG.maxConsecutiveErrors) {
            await updatePrefectureStatus(prefectureId, 'ERROR');
            logger.error(`${prefectureId} marked as ERROR after ${newErrorCount} consecutive errors`);
          } else {
            await prisma.prefecture.update({
              where: { id: prefectureId },
              data: { consecutiveErrors: newErrorCount },
            });
          }
        } else {
          // no_slots - reset error count
          await updatePrefectureStatus(prefectureId, 'ACTIVE');
        }

        // Update last scraped time
        await prisma.prefecture.update({
          where: { id: prefectureId },
          data: { lastScrapedAt: new Date() },
        });

        logger.debug(
          `Scraped ${prefectureId}: ${result.status}, ${result.slotsAvailable} slots, ${result.responseTimeMs}ms`
        );

      } catch (error) {
        logger.error(`Scraper job error for ${prefectureId}:`, error);
        throw error; // Let BullMQ handle retry
      }
    },
    effectiveConcurrency
  );

  if (worker) {
    worker.on('completed', (job) => {
      logger.debug(`Scraper job ${job.id} completed`);
    });

    worker.on('failed', (job, error) => {
      logger.error(`Scraper job ${job?.id} failed:`, error);
    });
  }

  return worker;
}

// Schedule repeatable jobs for active prefectures
export async function scheduleScraperJobs() {
  logger.info('Scheduling scraper jobs...');

  // Get all active prefectures with alerts
  const prefectures = await prisma.prefecture.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, checkInterval: true },
  });

  for (const pref of prefectures) {
    // Bootstrap mode: Skip non-priority prefectures
    if (!shouldScrapePrefecture(pref.id)) {
      logger.debug(`Skipping schedule for ${pref.id}: Not in bootstrap priority list`);
      continue;
    }

    // Check if there are active paying users
    const alertCount = await prisma.alert.count({
      where: {
        prefectureId: pref.id,
        isActive: true,
        user: {
          plan: { not: 'NONE' },
          planExpiresAt: { gt: new Date() },
        },
      },
    });

    const jobId = `repeat:${pref.id}`;
    
    // Use bootstrap-aware interval
    const effectiveInterval = getEffectiveInterval(pref.checkInterval);

    if (alertCount > 0) {
      // Add or update repeatable job
      await scraperQueue.add(
        `scrape:${pref.id}`,
        { prefectureId: pref.id },
        {
          repeat: { every: effectiveInterval * 1000 },
          jobId,
        }
      );
      logger.debug(`Scheduled ${pref.id} every ${effectiveInterval}s ${BOOTSTRAP_CONFIG.enabled ? '(bootstrap)' : ''}`);
    } else {
      // Remove job if no active alerts
      try {
        await scraperQueue.removeRepeatable(
          `scrape:${pref.id}`,
          { every: effectiveInterval * 1000, },
          jobId
        );
        logger.debug(`Removed schedule for ${pref.id} (no active alerts)`);
      } catch {
        // Job might not exist
      }
    }
  }

  logger.info(`Scheduled ${prefectures.length} prefectures`);
}

// Reschedule jobs (call periodically to sync with database)
export async function rescheduleScraperJobs() {
  await scheduleScraperJobs();
}
