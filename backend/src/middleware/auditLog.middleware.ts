import type { Request, Response, NextFunction } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';

export function auditLog(action: string, resourceType: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // Run after the route handler by attaching to res.on('finish')
    const originalEnd = _res.end;
    const userId = req.user?.id || null;
    const ip = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    _res.end = function (this: Response, ...args: Parameters<Response['end']>) {
      // Only log for successful mutations (2xx status codes)
      if (_res.statusCode >= 200 && _res.statusCode < 300) {
        const resourceId = req.params.id || req.body?.id || null;

        const metadata: Prisma.InputJsonValue = {
          method: req.method,
          path: req.path,
          statusCode: _res.statusCode,
          ...(req.method !== 'GET' && req.body ? { body: sanitizeBody(req.body) as Prisma.InputJsonValue } : {}),
        };

        prisma.auditLog.create({
          data: {
            userId,
            action,
            resourceType,
            resourceId,
            metadata,
            ip,
            userAgent,
          },
        }).catch(() => {
          // Don't fail the request if audit logging fails
        });
      }

      return originalEnd.apply(this, args);
    } as typeof _res.end;

    next();
  };
}

function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...body };
  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.passwordHash;
  delete sanitized.token;
  delete sanitized.refreshToken;
  return sanitized;
}
