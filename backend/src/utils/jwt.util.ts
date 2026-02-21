import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { Plan, Role } from '@prisma/client';

const MIN_SECRET_LENGTH = 32;
const ACCESS_TOKEN_EXPIRES_IN = '15m';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

export function validateJwtSecrets(): void {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!jwtSecret) {
    if (nodeEnv === 'production') {
      throw new Error('FATAL: JWT_SECRET is required in production');
    }
    console.warn('WARNING: JWT_SECRET not set. This is insecure for production.');
    return;
  }

  if (!jwtRefreshSecret) {
    if (nodeEnv === 'production') {
      throw new Error('FATAL: JWT_REFRESH_SECRET is required in production');
    }
    console.warn('WARNING: JWT_REFRESH_SECRET not set. This is insecure for production.');
    return;
  }

  if (nodeEnv === 'production') {
    if (jwtSecret.length < MIN_SECRET_LENGTH) {
      throw new Error(`FATAL: JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters in production`);
    }
    if (jwtRefreshSecret.length < MIN_SECRET_LENGTH) {
      throw new Error(`FATAL: JWT_REFRESH_SECRET must be at least ${MIN_SECRET_LENGTH} characters in production`);
    }
    if (jwtSecret === jwtRefreshSecret) {
      throw new Error('FATAL: JWT_SECRET and JWT_REFRESH_SECRET must be different');
    }
  } else {
    if (jwtSecret.length < MIN_SECRET_LENGTH) {
      console.warn(`WARNING: JWT_SECRET should be at least ${MIN_SECRET_LENGTH} characters`);
    }
    if (jwtRefreshSecret.length < MIN_SECRET_LENGTH) {
      console.warn(`WARNING: JWT_REFRESH_SECRET should be at least ${MIN_SECRET_LENGTH} characters`);
    }
  }
}

export interface JWTPayload {
  id: string;
  email: string;
  role: Role;
  plan: Plan;
  planExpiresAt: Date | null;
}

export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

export function generateRefreshTokenValue(): string {
  return crypto.randomBytes(40).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, getJwtSecret()) as JWTPayload;
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}

// Keep backward compatibility alias
export const generateToken = generateAccessToken;

export const REFRESH_TOKEN_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
