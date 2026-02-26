import type { Client } from '@prisma/client';
import * as bookingService from '../services/booking.service.js';
import { bookPrefectureAppointment } from './prefecture.booking.js';
import { bookVfsAppointment } from './vfs.booking.js';
import { bookEmbassyAppointment } from './embassy.booking.js';
import logger from '../utils/logger.util.js';

/**
 * Booking Orchestrator
 * 
 * Called when a slot is detected. Finds matching clients
 * and dispatches to the appropriate booking worker.
 */

export interface SlotInfo {
  system: 'PREFECTURE' | 'VFS' | 'EMBASSY';
  prefectureId?: string;
  vfsCenterId?: string;
  consulateId?: string;
  procedure?: string;
  date: string;        // YYYY-MM-DD
  time?: string;       // HH:MM
  slotsAvailable?: number;
}

/**
 * Handle a detected slot - find matching clients and book
 */
export async function handleSlotDetected(slot: SlotInfo): Promise<void> {
  logger.info(`[Booking] Slot detected: ${slot.system} - ${slot.date} ${slot.time || ''}`);

  // Find matching clients who want auto-booking
  const clients = await bookingService.findMatchingClients({
    system: slot.system,
    prefectureId: slot.prefectureId,
    vfsCenterId: slot.vfsCenterId,
    consulateId: slot.consulateId,
    procedure: slot.procedure as any,
    slotDate: new Date(slot.date),
  });

  if (clients.length === 0) {
    logger.debug(`[Booking] No auto-book clients match slot: ${slot.system} ${slot.date}`);
    return;
  }

  logger.info(`[Booking] ${clients.length} client(s) match slot. Processing by priority...`);

  // Process clients by priority (highest first)
  // For now, book for the first (highest priority) client
  // If multiple slots available, can book for multiple clients
  const maxBookings = slot.slotsAvailable || 1;
  const clientsToBook = clients.slice(0, maxBookings);

  for (const client of clientsToBook) {
    try {
      logger.info(`[Booking] Attempting booking for ${client.firstName} ${client.lastName} (${client.id})`);
      
      await dispatchBooking(client, slot);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[Booking] Dispatch failed for ${client.id}: ${errorMsg}`);
      await bookingService.markBookingFailed(client.id, errorMsg);
    }
  }
}

/**
 * Dispatch to the correct booking worker based on system
 */
async function dispatchBooking(client: Client, slot: SlotInfo): Promise<void> {
  switch (slot.system) {
    case 'PREFECTURE':
      await bookPrefectureAppointment(client, slot.date, slot.time);
      break;

    case 'VFS': {
      const result = await bookVfsAppointment(client, slot.date, slot.time);
      
      if (result.paymentRequired) {
        // VFS needs payment - the worker already set status to PAYMENT_WAIT
        // Admin will be notified via WebSocket/push notification
        logger.info(`[Booking] VFS payment required for ${client.firstName} - admin notified`);
      }
      break;
    }

    case 'EMBASSY':
      await bookEmbassyAppointment(client, slot.date, slot.time);
      break;

    default:
      logger.error(`[Booking] Unknown booking system: ${slot.system}`);
  }
}

/**
 * Re-export close functions for cleanup
 */
export { closeBrowser as closePrefectureBrowser } from './prefecture.booking.js';
export { closeBrowser as closeVfsBrowser } from './vfs.booking.js';
export { closeBrowser as closeEmbassyBrowser } from './embassy.booking.js';
