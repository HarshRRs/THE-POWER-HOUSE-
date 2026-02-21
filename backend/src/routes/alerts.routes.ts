import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { 
  createAlert, 
  getUserAlerts, 
  getAlertById, 
  toggleAlert, 
  deleteAlert 
} from '../services/alert.service.js';
import { validateBody, validateParams } from '../middleware/validation.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { planMiddleware } from '../middleware/plan.middleware.js';
import { createAlertSchema, updateAlertSchema, alertIdSchema } from '../validators/alert.validator.js';
import { sendSuccess, sendError } from '../utils/responses.util.js';
import { alertsUserLimiter } from '../middleware/userRateLimiter.middleware.js';

const router = Router();

// All alert routes require authentication + per-user rate limiting
router.use(authMiddleware);
router.use(alertsUserLimiter);

// GET /api/alerts - Get all user alerts
router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        sendError(res, 'Not authenticated', 401);
        return;
      }
      const alerts = await getUserAlerts(req.user.id);
      sendSuccess(res, alerts);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/alerts - Create new alert
router.post(
  '/',
  planMiddleware,
  validateBody(createAlertSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        sendError(res, 'Not authenticated', 401);
        return;
      }
      const alert = await createAlert(req.user.id, req.user.plan, req.body);
      sendSuccess(res, alert, 201);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/alerts/:id - Get single alert
router.get(
  '/:id',
  validateParams(alertIdSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        sendError(res, 'Not authenticated', 401);
        return;
      }
      const alertId = req.params.id as string;
      const alert = await getAlertById(alertId, req.user.id);
      sendSuccess(res, alert);
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/alerts/:id/toggle - Toggle alert active status
router.patch(
  '/:id/toggle',
  validateParams(alertIdSchema),
  validateBody(updateAlertSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        sendError(res, 'Not authenticated', 401);
        return;
      }
      const alertId = req.params.id as string;
      const alert = await toggleAlert(alertId, req.user.id, req.body.isActive);
      sendSuccess(res, alert);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/alerts/:id - Delete alert
router.delete(
  '/:id',
  validateParams(alertIdSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        sendError(res, 'Not authenticated', 401);
        return;
      }
      const alertId = req.params.id as string;
      await deleteAlert(alertId, req.user.id);
      sendSuccess(res, { message: 'Alert deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
