import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import * as bookingService from '../services/booking.service.js';
import * as captchaService from '../services/captcha.service.js';
import { createVfsAlerts } from '../services/vfs.service.js';
import { rescheduleVfsJobs } from '../workers/vfs.worker.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import logger from '../utils/logger.util.js';

const router = Router();

// All booking routes require admin auth
router.use(authMiddleware);
router.use(adminMiddleware);

const clientsQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'COMPLETED']).optional(),
  bookingStatus: z.enum(['IDLE', 'WAITING_SLOT', 'BOOKING', 'CAPTCHA_WAIT', 'PAYMENT_WAIT', 'BOOKED', 'FAILED']).optional(),
  system: z.enum(['PREFECTURE', 'VFS', 'EMBASSY']).optional(),
  autoBook: z.enum(['true', 'false']).optional(),
});

/**
 * GET /api/booking/clients
 * List all clients with optional filters
 */
router.get('/clients', async (req: Request, res: Response) => {
  try {
    const parsed = clientsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid query parameters', details: parsed.error.flatten().fieldErrors });
      return;
    }
    const { status, bookingStatus, system, autoBook } = parsed.data;
    const clients = await bookingService.getAllClients({
      status: status as any,
      bookingStatus: bookingStatus as any,
      bookingSystem: system as any,
      autoBook: autoBook === 'true' ? true : autoBook === 'false' ? false : undefined,
    });
    res.json({ clients });
  } catch (error) {
    logger.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

/**
 * GET /api/booking/clients/:id
 * Get client details with booking logs
 */
router.get('/clients/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const client = await bookingService.getClient(id);
    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }
    res.json({ client });
  } catch (error) {
    logger.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

/**
 * POST /api/booking/clients
 * Create a new client
 */
router.post('/clients', async (req: Request, res: Response) => {
  try {
    const {
      firstName, lastName, email, phone,
      dateOfBirth, nationality, passportNumber, foreignerNumber, passportFileNumber,
      bookingSystem, procedureType, procedure,
      prefectureId, vfsCenterId, vfsLoginEmail, vfsLoginPassword,
      destinationCountry, preferredCity, visaCategory,
      embassyServiceType, consulateId,
      datePreference, preferredAfter, preferredBefore,
      autoBook, priceAgreed, priority, notes,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !phone || !bookingSystem || !procedureType) {
      res.status(400).json({ error: 'Missing required fields: firstName, lastName, phone, bookingSystem, procedureType' });
      return;
    }

    if (priceAgreed === undefined || priceAgreed === null) {
      res.status(400).json({ error: 'priceAgreed is required' });
      return;
    }

    const client = await bookingService.createClient({
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      nationality,
      passportNumber,
      foreignerNumber,
      passportFileNumber,
      bookingSystem,
      procedureType,
      procedure,
      prefectureId,
      vfsCenterId,
      vfsLoginEmail,
      vfsLoginPassword,
      destinationCountry,
      preferredCity,
      visaCategory,
      embassyServiceType,
      consulateId,
      datePreference,
      preferredAfter: preferredAfter ? new Date(preferredAfter) : undefined,
      preferredBefore: preferredBefore ? new Date(preferredBefore) : undefined,
      autoBook,
      priceAgreed: parseFloat(priceAgreed),
      priority,
      notes,
    });

    // If VFS system with config/center/category info, auto-create VFS alerts
    let alertsCreated = 0;
    const { configId, centerIds, categoryIds } = req.body;
    if (bookingSystem === 'VFS' && configId && centerIds?.length && categoryIds?.length) {
      try {
        const alertResult = await createVfsAlerts({
          clientName: `${firstName} ${lastName}`,
          clientEmail: email,
          configId,
          centerIds,
          categoryIds,
        });
        alertsCreated = alertResult.alertsCreated;

        // Link client to the first alert
        if (alertResult.alertIds.length > 0) {
          await bookingService.updateClient(client.id, {
            alertId: alertResult.alertIds[0],
          });
        }

        // Reschedule VFS jobs so new alerts start monitoring immediately
        rescheduleVfsJobs().catch(err => 
          logger.error('Failed to reschedule VFS jobs:', err)
        );

        logger.info(`Created ${alertResult.alertIds.length} VFS alerts for client ${client.id}`);
      } catch (alertErr) {
        logger.error('Failed to create VFS alerts for client:', alertErr);
        // Don't fail the client creation - alerts can be created separately
      }
    }

    res.status(201).json({ client, alertsCreated });
  } catch (error) {
    logger.error('Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

/**
 * PATCH /api/booking/clients/:id
 * Update client details (only allowed fields)
 */
router.patch('/clients/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    // Whitelist allowed fields to prevent arbitrary overwrites
    const allowedFields = [
      'firstName', 'lastName', 'email', 'phone',
      'dateOfBirth', 'nationality', 'passportNumber', 'foreignerNumber', 'passportFileNumber',
      'procedureType', 'procedure', 'prefectureId', 'vfsCenterId', 'consulateId',
      'vfsLoginEmail', 'vfsLoginPassword', 'destinationCountry', 'preferredCity', 'visaCategory',
      'embassyServiceType', 'datePreference', 'preferredAfter', 'preferredBefore',
      'priceAgreed', 'priority', 'notes',
    ];

    const updates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    // Parse dates if present
    if (updates.dateOfBirth) updates.dateOfBirth = new Date(updates.dateOfBirth);
    if (updates.preferredAfter) updates.preferredAfter = new Date(updates.preferredAfter);
    if (updates.preferredBefore) updates.preferredBefore = new Date(updates.preferredBefore);
    if (updates.priceAgreed !== undefined) updates.priceAgreed = parseFloat(updates.priceAgreed);

    const client = await bookingService.updateClient(id, updates);
    res.json({ client });
  } catch (error) {
    logger.error('Error updating client:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

/**
 * DELETE /api/booking/clients/:id
 * Delete a client
 */
router.delete('/clients/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await bookingService.deleteClient(id);
    res.json({ message: 'Client deleted' });
  } catch (error) {
    logger.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

/**
 * POST /api/booking/clients/:id/toggle-autobook
 * Toggle auto-booking for a client
 */
router.post('/clients/:id/toggle-autobook', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const existing = await bookingService.getClient(id);
    if (!existing) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    const newAutoBook = !existing.autoBook;
    const client = await bookingService.updateClient(id, {
      autoBook: newAutoBook,
      bookingStatus: newAutoBook ? 'WAITING_SLOT' : 'IDLE',
    });

    await bookingService.logBookingAction(
      id,
      newAutoBook ? 'AUTOBOOK_ENABLED' : 'AUTOBOOK_DISABLED',
    );

    res.json({ client, autoBook: newAutoBook });
  } catch (error) {
    logger.error('Error toggling autobook:', error);
    res.status(500).json({ error: 'Failed to toggle auto-booking' });
  }
});

/**
 * POST /api/booking/clients/:id/payment
 * Record a payment
 */
router.post('/clients/:id/payment', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { amount, note } = req.body;
    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Valid amount is required' });
      return;
    }

    await bookingService.recordPayment(id, parseFloat(amount), note as string | undefined);
    const client = await bookingService.getClient(id);
    res.json({ client, message: `Payment of €${amount} recorded` });
  } catch (error) {
    logger.error('Error recording payment:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

/**
 * GET /api/booking/clients/:id/logs
 * Get booking logs for a client
 */
router.get('/clients/:id/logs', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const logs = await bookingService.getBookingLogs(id);
    res.json({ logs });
  } catch (error) {
    logger.error('Error fetching booking logs:', error);
    res.status(500).json({ error: 'Failed to fetch booking logs' });
  }
});

/**
 * GET /api/booking/stats
 * Get booking statistics
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await bookingService.getBookingStats();
    const captchaBalance = await captchaService.getCaptchaBalance();
    
    res.json({
      ...stats,
      captchaBalance,
      captchaConfigured: captchaService.isCaptchaServiceReady(),
    });
  } catch (error) {
    logger.error('Error fetching booking stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
