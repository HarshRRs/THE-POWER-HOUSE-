import { createWorker } from '../config/bullmq.js';
import { prisma } from '../config/database.js';
import { autobookPrefecture } from '../scraper/autobook/prefecture.autobook.js';
import { updateBookingStatus, markAsBooked, markBookingFailed } from '../services/booking.service.js';
import logger from '../utils/logger.util.js';

export interface AutobookJobData {
    clientId: string;
    prefectureId: string;
    bookingUrl: string;
}

export async function startAutobookWorker(workerId: string, concurrency = 2) {
    logger.info(`Starting autobook worker ${workerId} with concurrency ${concurrency}`);

    const worker = createWorker<AutobookJobData>(
        'autobook',
        async (job) => {
            const { clientId, bookingUrl } = job.data;

            const client = await prisma.client.findUnique({ where: { id: clientId } });
            if (!client) {
                logger.error(`Client ${clientId} not found for autobook job`);
                return;
            }

            logger.info(`Processing autobook job for Client ${clientId} => ${client.firstName} ${client.lastName}`);

            try {
                // Optimistically set status to BOOKING
                await updateBookingStatus(clientId, 'BOOKING', `Executing Playwright auto-fill against ${bookingUrl}`);

                // Run automation
                const result = await autobookPrefecture(client, bookingUrl);

                if (result.success && result.bookingRef) {
                    await markAsBooked(clientId, {
                        bookingDate: new Date(),
                        bookingRef: result.bookingRef,
                        bookingUrl,
                        bookingScreenshot: result.screenshotPath
                    });
                    logger.info(`Successfully auto-booked client ${clientId}`);
                } else {
                    throw new Error(result.error || 'Unknown booking error');
                }

            } catch (error) {
                let errorMessage = error instanceof Error ? error.message : String(error);
                logger.error(`Autobooking failed for client ${clientId}:`, errorMessage);
                await markBookingFailed(clientId, errorMessage);
                throw error; // Let BullMQ log the failure natively
            }
        },
        concurrency
    );

    if (worker) {
        worker.on('completed', (job) => {
            logger.debug(`Autobook job ${job.id} completed`);
        });

        worker.on('failed', (job, error) => {
            logger.error(`Autobook job ${job?.id} failed:`, error);
        });
    }

    return worker;
}
