import { createWorker } from '../config/bullmq.js';
import { prisma } from '../config/database.js';
import { bookPrefectureAppointment } from '../booking/prefecture.booking.js';
import { updateBookingStatus, markAsBooked, markBookingFailed } from '../services/booking.service.js';
import logger from '../utils/logger.util.js';

export interface AutobookJobData {
    clientId: string;
    prefectureId: string;
    categoryCode: string;  // Required for category-specific booking
    bookingUrl: string;
    slotDate: string;
    slotTime?: string;
}

export async function startAutobookWorker(workerId: string, concurrency = 2) {
    logger.info(`Starting autobook worker ${workerId} with concurrency ${concurrency}`);

    const worker = createWorker<AutobookJobData>(
        'autobook',
        async (job) => {
            const { clientId, categoryCode, slotDate, slotTime } = job.data;

            const client = await prisma.client.findUnique({ 
                where: { id: clientId },
                include: { prefecture: true }
            });
            if (!client) {
                logger.error(`Client ${clientId} not found for autobook job`);
                return;
            }

            logger.info(`Processing autobook job for Client ${clientId} => ${client.firstName} ${client.lastName} (category: ${categoryCode})`);

            try {
                // Optimistically set status to BOOKING
                await updateBookingStatus(clientId, 'BOOKING', `Auto-booking for category ${categoryCode}, slot ${slotDate} ${slotTime || ''}`);

                // Run the booking automation with category support and Turnstile handling
                const result = await bookPrefectureAppointment(client, categoryCode, slotDate, slotTime);

                if (result.success && result.bookingRef) {
                    await markAsBooked(clientId, {
                        bookingDate: result.bookingDate || new Date(slotDate),
                        bookingTime: result.bookingTime,
                        bookingRef: result.bookingRef,
                        bookingUrl: job.data.bookingUrl,
                        bookingScreenshot: result.screenshotPath
                    });
                    logger.info(`Successfully auto-booked client ${clientId} for ${slotDate}`);
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
