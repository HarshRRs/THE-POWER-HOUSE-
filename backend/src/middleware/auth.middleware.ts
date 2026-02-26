import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util.js';
import { sendError } from '../utils/responses.util.js';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Authentication required', 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role || 'USER',
      plan: payload.plan,
      planExpiresAt: payload.planExpiresAt ? new Date(payload.planExpiresAt) : null,
    };

    // Check plan expiry (exempt billing routes so users can renew)
    if (req.user.planExpiresAt && req.user.planExpiresAt < new Date()) {
      const isBillingRoute = req.originalUrl.startsWith('/api/billing');
      const isAuthRoute = req.originalUrl.startsWith('/api/auth');
      if (!isBillingRoute && !isAuthRoute && req.user.role !== 'ADMIN') {
        sendError(res, 'Your plan has expired. Please renew your subscription.', 403);
        return;
      }
    }

    next();
  } catch {
    sendError(res, 'Invalid or expired token', 401);
  }
}

export function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role || 'USER',
      plan: payload.plan,
      planExpiresAt: payload.planExpiresAt ? new Date(payload.planExpiresAt) : null,
    };
  } catch {
    // Token invalid but request can proceed without auth
  }

  next();
}
