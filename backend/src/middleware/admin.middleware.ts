import type { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/responses.util.js';

export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    sendError(res, 'Authentication required', 401);
    return;
  }

  if (req.user.role !== 'ADMIN') {
    sendError(res, 'Admin access required', 403);
    return;
  }

  next();
}
