import { createWorker, scraperQueue } from '../config/bullmq.js';
import { prisma } from '../config/database.js';
import { scrapePrefecture, scrapePrefectureCategory, type CategoryInfo } from '../scraper/base.scraper.js';
import { getPrefectureConfig } from '../scraper/prefectures/index.js';
import { getPrefectureCategories, getCategoryUrl, isRdvPrefectureSystem } from '../config/prefecture-categories.config.js';
import { processDetection } from '../services/detection.service.js';
import { updatePrefectureStatus } from '../services/prefecture.service.js';
import { sendManualCaptchaAlert } from '../services/manual-captcha.service.js';
import { SCRAPER_CONFIG } from '../config/constants.js';
import { BOOTSTRAP_CONFIG, getEffectiveInterval, shouldScrapePrefecture, logBootstrapStatus } from '../config/bootstrap.config.js';
import logger from '../utils/logger.util.js';
import type { ScrapeJobData, ScrapeResult } from '../types/prefecture.types.js';

export async function startScraperWorker(workerId: string, concurrency = 1) {
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
          },
          select: { id: true },
        });

        // Always scrape priority prefectures for monitoring, even without alerts
        const isPriority = BOOTSTRAP_CONFIG.priorityPrefectureIds.includes(prefectureId);
        if (alerts.length === 0 && !isPriority) {
          logger.debug(`No active alerts for ${prefectureId}, skipping`);
          return;
        }

        // ── Category-level scraping (each demarche = separate result) ──
        const categories = getPrefectureCategories(prefectureId);

        let results: { result: ScrapeResult; categoryCode?: string; categoryName?: string }[] = [];

        if (categories.length > 0) {
          // Scrape each category independently
          logger.info(`Scraping ${prefectureId}: ${categories.length} categories`);

          for (const cat of categories) {
            const catInfo: CategoryInfo = {
              code: cat.code,
              name: cat.name,
              url: isRdvPrefectureSystem(prefectureId)
                ? getCategoryUrl(cat.code)
                : config.bookingUrl,
            };

            try {
              const catResult = await scrapePrefectureCategory(config, catInfo);
              results.push({ result: catResult, categoryCode: cat.code, categoryName: cat.name });

              logger.info(
                `  ${prefectureId}/${cat.name} (${cat.code}): ${catResult.status}, ${catResult.slotsAvailable} slots, ${catResult.responseTimeMs}ms`
              );
            } catch (catError) {
              const errMsg = catError instanceof Error ? catError.message : 'Unknown error';
              logger.error(`  ${prefectureId}/${cat.name} (${cat.code}): ERROR - ${errMsg}`);
              results.push({
                result: {
                  status: 'error',
                  slotsAvailable: 0,
                  bookingUrl: config.bookingUrl,
                  responseTimeMs: 0,
                  errorMessage: errMsg,
                },
                categoryCode: cat.code,
                categoryName: cat.name,
              });
            }
          }
        } else {
          // No categories configured — scrape the whole prefecture as before
          const result = await scrapePrefecture(config);
          results.push({ result });
        }

        // Log all results to database
        for (const { result, categoryCode, categoryName } of results) {
          await prisma.scraperLog.create({
            data: {
              prefectureId,
              categoryCode: categoryCode || null,
              workerId,
              status: result.status,
              slotsFound: result.slotsAvailable,
              responseTimeMs: result.responseTimeMs,
              errorMessage: result.errorMessage,
              screenshotPath: result.screenshotPath,
              finalUrl: result.finalUrl,
              redirectCount: result.redirectCount || 0,
              urlChanged: result.urlChanged || false,
            },
          });
        }

        // Aggregate: pick the "best" result for status tracking
        const bestResult = results.find(r => r.result.status === 'slots_found')?.result
          ?? results.find(r => r.result.status === 'no_slots')?.result
          ?? results[0]?.result
          ?? { status: 'error', slotsAvailable: 0, bookingUrl: config.bookingUrl, responseTimeMs: 0 };

        const totalSlots = results.reduce((sum, r) => sum + r.result.slotsAvailable, 0);
        const result = { ...bestResult, slotsAvailable: totalSlots };

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
        } else if (result.status === 'blocked') {
          // BLOCKED by Cloudflare / bot detection — treat as error, NOT as no_slots
          const newErrorCount = (prefecture.consecutiveErrors || 0) + 1;
          logger.warn(`${prefectureId} BLOCKED (attempt ${newErrorCount}): ${result.errorMessage}`);

          if (newErrorCount >= SCRAPER_CONFIG.maxConsecutiveErrors) {
            await updatePrefectureStatus(prefectureId, 'ERROR');
            logger.error(`${prefectureId} marked as ERROR after ${newErrorCount} consecutive blocks`);
          } else {
            await prisma.prefecture.update({
              where: { id: prefectureId },
              data: { consecutiveErrors: newErrorCount },
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
    // Skip prefectures without a valid config (e.g. stale DB entries)
    if (!getPrefectureConfig(pref.id)) {
      logger.debug(`Skipping schedule for ${pref.id}: No config found`);
      continue;
    }

    // Bootstrap mode: Skip non-priority prefectures
    if (!shouldScrapePrefecture(pref.id)) {
      logger.debug(`Skipping schedule for ${pref.id}: Not in bootstrap priority list`);
      continue;
    }

    // Check if there are active alerts or if it's a priority prefecture
    const alertCount = await prisma.alert.count({
      where: {
        prefectureId: pref.id,
        isActive: true,
      },
    });

    const isPriority = BOOTSTRAP_CONFIG.priorityPrefectureIds.includes(pref.id);
    const jobId = `repeat:${pref.id}`;

    // Use bootstrap-aware interval
    const effectiveInterval = getEffectiveInterval(pref.checkInterval);

    if (alertCount > 0 || isPriority) {
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
