import type { Plan, Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
        plan: Plan;
        planExpiresAt: Date | null;
      };
      requestId?: string;
    }
  }
}

export {};
