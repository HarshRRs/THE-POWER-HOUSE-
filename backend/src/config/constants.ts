import type { Plan, NotificationChannel } from '@prisma/client';

export interface PlanConfig {
  maxAlerts: number;
  checkInterval: number;
  duration: number;
  channels: NotificationChannel[];
  price: number;
  type: 'one_time' | 'subscription';
}

export const PLAN_LIMITS: Record<Plan, PlanConfig> = {
  NONE: {
    maxAlerts: 0,
    checkInterval: 0,
    duration: 0,
    channels: [],
    price: 0,
    type: 'one_time',
  },
  URGENCE_24H: {
    maxAlerts: 1,
    checkInterval: 120,
    duration: 24 * 60 * 60 * 1000, // 24 hours
    channels: ['EMAIL'],
    price: 499,
    type: 'one_time',
  },
  URGENCE_7J: {
    maxAlerts: 3,
    checkInterval: 60,
    duration: 7 * 24 * 60 * 60 * 1000, // 7 days
    channels: ['EMAIL', 'TELEGRAM'],
    price: 1499,
    type: 'one_time',
  },
  URGENCE_TOTAL: {
    maxAlerts: Infinity,
    checkInterval: 30,
    duration: 30 * 24 * 60 * 60 * 1000, // 30 days
    channels: ['EMAIL', 'TELEGRAM', 'SMS', 'WEBSOCKET', 'FCM'],
    price: 2999,
    type: 'subscription',
  },
};

export const TIER_INTERVALS = {
  1: 30,   // Île-de-France critical
  2: 60,   // Major cities
  3: 120,  // Others
} as const;

export const TIER_NAMES = {
  1: 'Île-de-France (Critical)',
  2: 'Major Cities (High)',
  3: 'Standard',
} as const;

export const BCRYPT_ROUNDS = 12;
export const JWT_EXPIRES_IN = '7d';

export const RATE_LIMITS = {
  auth: {
    windowMs: 60 * 1000, // 1 minute
    max: 5,
  },
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
  },
};

export const QUEUE_NAMES = {
  scraper: 'scraper',
  notifications: 'notifications',
  maintenance: 'maintenance',
} as const;

export const SCRAPER_CONFIG = {
  maxBrowsers: 3,
  pageTimeout: 30000,
  screenshotDir: './public/screenshots',
  maxConsecutiveErrors: 5,
  captchaPauseDuration: 60 * 60 * 1000, // 1 hour
};
