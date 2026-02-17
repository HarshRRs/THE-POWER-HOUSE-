import type { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/responses.util.js';

export function planMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    sendError(res, 'Authentication required', 401);
    return;
  }

  if (req.user.plan === 'NONE') {
    sendError(res, 'Active plan required. Please subscribe to use this feature.', 403);
    return;
  }

  if (req.user.planExpiresAt && req.user.planExpiresAt < new Date()) {
    sendError(res, 'Your plan has expired. Please renew to continue.', 403);
    return;
  }

  next();
}

export function requirePlan(...allowedPlans: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (!allowedPlans.includes(req.user.plan)) {
      sendError(res, `This feature requires one of: ${allowedPlans.join(', ')}`, 403);
      return;
    }

    if (req.user.planExpiresAt && req.user.planExpiresAt < new Date()) {
      sendError(res, 'Your plan has expired. Please renew to continue.', 403);
      return;
    }

    next();
  };
}
