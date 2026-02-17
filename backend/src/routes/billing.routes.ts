import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import express from 'express';
import {
  createCheckoutSession,
  handleWebhook,
  getPaymentHistory,
  cancelUserSubscription
} from '../services/stripe.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { createCheckoutSchema } from '../validators/billing.validator.js';
import { sendSuccess, sendError } from '../utils/responses.util.js';
import { PLAN_LIMITS } from '../config/constants.js';

const router = Router();

// GET /api/billing/plans - Get available plans
router.get('/plans', (_req: Request, res: Response) => {
  try {
    const plans = Object.entries(PLAN_LIMITS)
      .filter(([key]) => key !== 'NONE')
      .map(([key, config]) => {
        // Handle potential checks for config validity here if needed
        return {
          id: key,
          name: key.replace(/_/g, ' '),
          price: config.price / 100, // Convert cents to euros
          currency: 'EUR',
          duration: config.type === 'subscription' ? 'monthly' : `${(config.duration || 0) / (24 * 60 * 60 * 1000)} days`,
          maxAlerts: config.maxAlerts === Infinity ? 'Unlimited' : config.maxAlerts,
          channels: config.channels,
          checkInterval: config.checkInterval,
          type: config.type,
        };
      });

    sendSuccess(res, plans);
  } catch (error) {
    // Should not happen given it's static data, but good practice
    sendError(res, 'Failed to fetch plans', 500);
  }
});

// POST /api/billing/checkout - Create checkout session
router.post(
  '/checkout',
  authMiddleware,
  validateBody(createCheckoutSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        sendError(res, 'Not authenticated', 401);
        return;
      }

      const result = await createCheckoutSession(
        req.user.id,
        req.user.email,
        req.body.plan
      );

      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/billing/webhook - Stripe webhook handler
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const signature = req.headers['stripe-signature'] as string;

      if (!signature) {
        sendError(res, 'Missing stripe signature', 400);
        return;
      }

      const result = await handleWebhook(req.body, signature);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/billing/history - Get payment history
router.get(
  '/history',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        sendError(res, 'Not authenticated', 401);
        return;
      }

      const payments = await getPaymentHistory(req.user.id);
      sendSuccess(res, payments);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/billing/cancel - Cancel subscription
router.post(
  '/cancel',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        sendError(res, 'Not authenticated', 401);
        return;
      }

      const result = await cancelUserSubscription(req.user.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
