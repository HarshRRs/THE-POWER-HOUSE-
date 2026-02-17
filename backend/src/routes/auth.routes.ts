import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser, getUserById } from '../services/auth.service.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimiter.middleware.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { sendSuccess, sendError } from '../utils/responses.util.js';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await registerUser(req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await loginUser(req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/auth/me
router.get(
  '/me',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        sendError(res, 'Not authenticated', 401);
        return;
      }
      const user = await getUserById(req.user.id);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
