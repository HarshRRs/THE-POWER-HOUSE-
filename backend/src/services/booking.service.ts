import { prisma } from '../config/database.js';
import type { Client, BookingStatus, ClientStatus, BookingSystem, Procedure } from '@prisma/client';
import logger from '../utils/logger.util.js';

/**
 * Auto-booking service - manages client bookings lifecycle
 */

// ─── Client CRUD ─────────────────────────────────────

export async function createClient(data: {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  dateOfBirth?: Date;
  nationality?: string;
  passportNumber?: string;
  foreignerNumber?: string;
  passportFileNumber?: string;
  bookingSystem: BookingSystem;
  procedureType: string;
  procedure?: Procedure;
  prefectureId?: string;
  vfsCenterId?: string;
  vfsLoginEmail?: string;
  vfsLoginPassword?: string;
  destinationCountry?: string;
  preferredCity?: string;
  visaCategory?: string;
  embassyServiceType?: string;
  consulateId?: string;
  datePreference?: string;
  preferredAfter?: Date;
  preferredBefore?: Date;
  autoBook?: boolean;
  priceAgreed: number;
  priority?: string;
  notes?: string;
}): Promise<Client> {
  const client = await prisma.client.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      nationality: data.nationality || 'Indian',
      passportNumber: data.passportNumber,
      foreignerNumber: data.foreignerNumber,
      passportFileNumber: data.passportFileNumber,
      bookingSystem: data.bookingSystem,
      procedureType: data.procedureType as any,
      procedure: data.procedure,
      prefectureId: data.prefectureId,
      vfsCenterId: data.vfsCenterId,
      vfsLoginEmail: data.vfsLoginEmail,
      vfsLoginPassword: data.vfsLoginPassword,
      destinationCountry: data.destinationCountry,
      preferredCity: data.preferredCity,
      visaCategory: data.visaCategory,
      embassyServiceType: data.embassyServiceType,
      consulateId: data.consulateId,
      datePreference: (data.datePreference as any) || 'EARLIEST',
      preferredAfter: data.preferredAfter,
      preferredBefore: data.preferredBefore,
      autoBook: data.autoBook ?? false,
      bookingStatus: data.autoBook ? 'WAITING_SLOT' : 'IDLE',
      priceAgreed: data.priceAgreed,
      priority: (data.priority as any) || 'NORMAL',
      notes: data.notes,
      amountDue: data.priceAgreed,
    },
  });

  logger.info(`Client created: ${client.id} - ${data.firstName} ${data.lastName} (${data.bookingSystem})`);
  
  // Log the creation
  await logBookingAction(client.id, 'CLIENT_CREATED', `System: ${data.bookingSystem}, AutoBook: ${data.autoBook}`);

  return client;
}

export async function getClient(id: string): Promise<Client | null> {
  return prisma.client.findUnique({
    where: { id },
    include: {
      prefecture: true,
      vfsCenter: true,
      consulate: true,
      bookingLogs: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });
}

export async function getAllClients(filters?: {
  status?: ClientStatus;
  bookingStatus?: BookingStatus;
  bookingSystem?: BookingSystem;
  autoBook?: boolean;
}): Promise<Client[]> {
  return prisma.client.findMany({
    where: {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.bookingStatus && { bookingStatus: filters.bookingStatus }),
      ...(filters?.bookingSystem && { bookingSystem: filters.bookingSystem }),
      ...(filters?.autoBook !== undefined && { autoBook: filters.autoBook }),
    },
    include: {
      prefecture: { select: { id: true, name: true } },
      vfsCenter: { select: { id: true, name: true, city: true } },
      consulate: { select: { id: true, name: true } },
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
  });
}

export async function updateClient(id: string, data: Partial<Client>): Promise<Client> {
  return prisma.client.update({
    where: { id },
    data,
  });
}

export async function deleteClient(id: string): Promise<void> {
  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) throw new Error('Client not found');
  await prisma.client.delete({ where: { id } });
  logger.info(`Client deleted: ${id}`);
}

// ─── Auto-Booking Logic ─────────────────────────────────

/**
 * Get clients waiting for auto-booking for a specific system
 */
export async function getAutoBookClients(system: BookingSystem): Promise<Client[]> {
  return prisma.client.findMany({
    where: {
      bookingSystem: system,
      autoBook: true,
      bookingStatus: 'WAITING_SLOT',
      status: 'WAITING',
    },
    include: {
      prefecture: true,
      vfsCenter: true,
      consulate: true,
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'asc' },
    ],
  });
}

/**
 * Find matching clients when a slot is detected
 * Returns clients whose booking criteria match the slot
 */
export async function findMatchingClients(params: {
  system: BookingSystem;
  prefectureId?: string;
  vfsCenterId?: string;
  consulateId?: string;
  procedure?: Procedure;
  slotDate?: Date;
}): Promise<Client[]> {
  const { system, prefectureId, vfsCenterId, consulateId, procedure, slotDate } = params;

  const whereClause: any = {
    bookingSystem: system,
    autoBook: true,
    bookingStatus: 'WAITING_SLOT',
    status: 'WAITING',
  };

  // Match by location
  if (system === 'PREFECTURE' && prefectureId) {
    whereClause.prefectureId = prefectureId;
  } else if (system === 'VFS' && vfsCenterId) {
    whereClause.vfsCenterId = vfsCenterId;
  } else if (system === 'EMBASSY' && consulateId) {
    whereClause.consulateId = consulateId;
  }

  // Match by procedure if specified
  if (procedure) {
    whereClause.procedure = procedure;
  }

  const clients = await prisma.client.findMany({
    where: whereClause,
    include: {
      prefecture: true,
      vfsCenter: true,
      consulate: true,
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'asc' },
    ],
  });

  // Filter by date preference
  if (slotDate) {
    return clients.filter(client => isDateAcceptable(client, slotDate));
  }

  return clients;
}

/**
 * Check if a slot date matches client's date preference
 */
function isDateAcceptable(client: Client, slotDate: Date): boolean {
  switch (client.datePreference) {
    case 'EARLIEST':
      return true; // Any date is OK

    case 'AFTER':
      return client.preferredAfter ? slotDate >= client.preferredAfter : true;

    case 'BEFORE':
      return client.preferredBefore ? slotDate <= client.preferredBefore : true;

    case 'BETWEEN':
      const afterOk = client.preferredAfter ? slotDate >= client.preferredAfter : true;
      const beforeOk = client.preferredBefore ? slotDate <= client.preferredBefore : true;
      return afterOk && beforeOk;

    default:
      return true;
  }
}

/**
 * Select best date from available dates based on client preference
 */
export function selectBestDate(client: Client, availableDates: Date[]): Date | null {
  if (availableDates.length === 0) return null;

  const sorted = [...availableDates].sort((a, b) => a.getTime() - b.getTime());
  const acceptable = sorted.filter(d => isDateAcceptable(client, d));

  if (acceptable.length === 0) return null;

  // Always pick the earliest acceptable date
  return acceptable[0];
}

// ─── Booking Status Management ──────────────────────────

export async function updateBookingStatus(
  clientId: string, 
  status: BookingStatus,
  details?: string
): Promise<void> {
  await prisma.client.update({
    where: { id: clientId },
    data: {
      bookingStatus: status,
      lastAttemptAt: new Date(),
      ...(status === 'FAILED' && { 
        bookingAttempts: { increment: 1 },
        lastAttemptError: details,
      }),
    },
  });

  await logBookingAction(clientId, `STATUS_${status}`, details);
}

export async function markAsBooked(clientId: string, result: {
  bookingDate: Date;
  bookingTime?: string;
  bookingRef?: string;
  bookingUrl?: string;
  bookingScreenshot?: string;
}): Promise<void> {
  await prisma.client.update({
    where: { id: clientId },
    data: {
      bookingStatus: 'BOOKED',
      status: 'BOOKED',
      bookingDate: result.bookingDate,
      bookingTime: result.bookingTime,
      bookingRef: result.bookingRef,
      bookingUrl: result.bookingUrl,
      bookingScreenshot: result.bookingScreenshot,
      bookedAt: new Date(),
    },
  });

  await logBookingAction(clientId, 'BOOKED', 
    `Date: ${result.bookingDate.toISOString()}, Ref: ${result.bookingRef || 'N/A'}`
  );

  logger.info(`Client ${clientId} BOOKED: ${result.bookingDate.toISOString()} ${result.bookingTime || ''}`);
}

export async function markBookingFailed(clientId: string, error: string): Promise<void> {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  
  // Reset to WAITING_SLOT so it retries on next slot
  await prisma.client.update({
    where: { id: clientId },
    data: {
      bookingStatus: client && client.bookingAttempts >= 10 ? 'FAILED' : 'WAITING_SLOT',
      bookingAttempts: { increment: 1 },
      lastAttemptAt: new Date(),
      lastAttemptError: error,
    },
  });

  await logBookingAction(clientId, 'BOOKING_FAILED', error);
}

// ─── Payment Tracking ───────────────────────────────────

export async function recordPayment(clientId: string, amount: number, note?: string): Promise<void> {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) throw new Error('Client not found');

  const newPaid = client.amountPaid + amount;
  const newDue = Math.max(0, client.priceAgreed - newPaid);

  await prisma.client.update({
    where: { id: clientId },
    data: {
      amountPaid: newPaid,
      amountDue: newDue,
      status: newDue <= 0 ? 'COMPLETED' : client.status,
    },
  });

  await logBookingAction(clientId, 'PAYMENT_RECEIVED', 
    `Amount: €${amount}${note ? `, Note: ${note}` : ''}`
  );
}

// ─── Statistics ──────────────────────────────────────────

export async function getBookingStats() {
  const [total, waiting, booking, booked, failed, paid] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({ where: { bookingStatus: 'WAITING_SLOT' } }),
    prisma.client.count({ where: { bookingStatus: 'BOOKING' } }),
    prisma.client.count({ where: { bookingStatus: 'BOOKED' } }),
    prisma.client.count({ where: { bookingStatus: 'FAILED' } }),
    prisma.client.count({ where: { status: 'COMPLETED' } }),
  ]);

  const revenue = await prisma.client.aggregate({
    _sum: { amountPaid: true, priceAgreed: true },
  });

  return {
    total,
    waiting,
    booking,
    booked,
    failed,
    paid,
    totalRevenue: revenue._sum.priceAgreed || 0,
    totalCollected: revenue._sum.amountPaid || 0,
    totalPending: (revenue._sum.priceAgreed || 0) - (revenue._sum.amountPaid || 0),
  };
}

// ─── Logging ─────────────────────────────────────────────

export async function logBookingAction(
  clientId: string,
  action: string,
  details?: string,
  screenshotPath?: string
): Promise<void> {
  try {
    await prisma.bookingLog.create({
      data: {
        clientId,
        action,
        details,
        screenshotPath,
      },
    });
  } catch (error) {
    logger.error(`Failed to log booking action: ${error}`);
  }
}

export async function getBookingLogs(clientId: string, limit = 50) {
  return prisma.bookingLog.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
