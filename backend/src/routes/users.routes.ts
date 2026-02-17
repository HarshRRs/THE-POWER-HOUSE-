import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { 
  updateProfileSchema, 
  updateNotificationPrefsSchema, 
  updateFcmTokenSchema 
} from '../validators/user.validator.js';
import { sendSuccess, sendError } from '../utils/responses.util.js';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

// PATCH /api/users/profile - Update user profile
router.patch(
  '/profile',
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

export default router;
