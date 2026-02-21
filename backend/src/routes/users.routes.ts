import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { auditLog } from '../middleware/auditLog.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { 
  updateProfileSchema, 
  updateNotificationPrefsSchema, 
  updateFcmTokenSchema 
} from '../validators/user.validator.js';
import { sendSuccess, sendError, sendMessage } from '../utils/responses.util.js';
import { revokeAllUserTokens } from '../services/auth.service.js';
import { userRateLimiter } from '../middleware/userRateLimiter.middleware.js';
import logger from '../utils/logger.util.js';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

// PATCH /api/users/profile - Update user profile
router.patch(
  '/profile',
  auditLog('update_profile', 'user'),
  validateBody(updateProfileSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        sendError(res, 'Not authenticated', 401);
        return;
      }

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: req.body,
        select: {
          id: true,
          email: true,
          phone: true,
          whatsappNumber: true,
          telegramChatId: true,
          plan: true,
          planExpiresAt: true,
        },
      });

      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/users/notifications - Update notification preferences
router.patch(
  '/notifications',
  auditLog('update_notifications', 'user'),
  validateBody(updateNotificationPrefsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        sendError(res, 'Not authenticated', 401);
        return;
      }

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: req.body,
        select: {
          notifyEmail: true,
          notifyWhatsapp: true,
          notifyTelegram: true,
          notifySms: true,
          notifyFcm: true,
        },
      });

      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/users/fcm-token - Add or remove FCM token
router.patch(
  '/fcm-token',
  validateBody(updateFcmTokenSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        sendError(res, 'Not authenticated', 401);
        return;
      }

      const { token, action } = req.body;

      const currentUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { fcmTokens: true },
      });

      let fcmTokens = currentUser?.fcmTokens || [];

      if (action === 'add') {
        if (!fcmTokens.includes(token)) {
          fcmTokens.push(token);
        }
      } else if (action === 'remove') {
        fcmTokens = fcmTokens.filter((t) => t !== token);
      }

      await prisma.user.update({
        where: { id: req.user.id },
        data: { fcmTokens },
      });

      sendSuccess(res, { message: `FCM token ${action}ed successfully` });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/users/detections - Get user's detection history
router.get(
  '/detections',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        sendError(res, 'Not authenticated', 401);
        return;
      }

      const limit = parseInt(req.query.limit as string) || 20;

      const detections = await prisma.detection.findMany({
        where: {
          alert: { userId: req.user.id },
        },
        include: {
          prefecture: {
            select: {
              name: true,
              department: true,
            },
          },
        },
        orderBy: { detectedAt: 'desc' },
        take: limit,
      });

      sendSuccess(res, detections);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/users/export - GDPR: Export all user data
router.get(
  '/export',
  userRateLimiter({ windowMs: 60 * 60 * 1000, max: 1, message: 'Data export limited to once per hour.' }),
  auditLog('data_export', 'user'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        sendError(res, 'Not authenticated', 401);
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          phone: true,
          whatsappNumber: true,
          telegramChatId: true,
          role: true,
          plan: true,
          planExpiresAt: true,
          emailVerified: true,
          notifyEmail: true,
          notifyWhatsapp: true,
          notifyTelegram: true,
          notifySms: true,
          notifyFcm: true,
          createdAt: true,
          updatedAt: true,
          alerts: {
            select: {
              id: true,
              prefectureId: true,
              procedure: true,
              isActive: true,
              slotsFound: true,
              notificationsSent: true,
              createdAt: true,
            },
          },
          payments: {
            select: {
              id: true,
              plan: true,
              amount: true,
              currency: true,
              status: true,
              createdAt: true,
              paidAt: true,
            },
          },
          notifications: {
            select: {
              id: true,
              channel: true,
              type: true,
              title: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
          },
        },
      });

      if (!user) {
        sendError(res, 'User not found', 404);
        return;
      }

      // Return as downloadable JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=rdvpriority-data-${user.id}.json`);
      sendSuccess(res, {
        exportedAt: new Date().toISOString(),
        userData: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/users/me - GDPR: Delete account (right to be forgotten)
router.delete(
  '/me',
  auditLog('account_deletion', 'user'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        sendError(res, 'Not authenticated', 401);
        return;
      }

      const { password } = req.body;

      if (!password) {
        sendError(res, 'Password confirmation required', 400);
        return;
      }

      // Verify password
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, passwordHash: true, email: true },
      });

      if (!user) {
        sendError(res, 'User not found', 404);
        return;
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        sendError(res, 'Invalid password', 401);
        return;
      }

      // Revoke all refresh tokens
      await revokeAllUserTokens(user.id);

      // Delete user (cascades to alerts, detections, payments, notifications via Prisma relations)
      await prisma.user.delete({ where: { id: user.id } });

      logger.info(`Account deleted: ${user.email} (${user.id})`);
      sendMessage(res, 'Account deleted successfully.');
    } catch (error) {
      next(error);
    }
  }
);

export default router;
