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
    channels: ['EMAIL', 'WHATSAPP', 'TELEGRAM'],
    price: 1499,
    type: 'one_time',
  },
  URGENCE_TOTAL: {
    maxAlerts: Infinity,
    checkInterval: 30,
    duration: 30 * 24 * 60 * 60 * 1000, // 30 days
    channels: ['EMAIL', 'WHATSAPP', 'TELEGRAM', 'SMS', 'WEBSOCKET', 'FCM'],
    price: 2999,
    type: 'subscription',
  },
};

export const TIER_INTERVALS = {
  1: 10,   // Île-de-France critical - every 10 seconds
  2: 20,   // Major cities - every 20 seconds
  3: 45,   // Others - every 45 seconds
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
  refresh: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 refresh attempts per 15 minutes per IP
  },
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
  },
};

export const QUEUE_NAMES = {
  scraper: 'scraper',
  consulate: 'consulate',
  vfs: 'vfs',
  booking: 'booking',
  notifications: 'notifications',
  maintenance: 'maintenance',
} as const;

export const BOOKING_CONFIG = {
  maxBookingTimeMs: 60000,     // Max 60 seconds per booking attempt
  maxRetries: 10,              // Max retries before giving up
  captchaTimeoutMs: 120000,    // 2 minutes max for CAPTCHA solve
  screenshotDir: './screenshots/bookings',
  pageTimeoutMs: 30000,
};

export const CONSULATE_CONFIG = {
  maxConsecutiveErrors: 5,
  csrfTokenTtlMs: 15 * 60 * 1000,
  requestDelayMs: 500,
  maxDatesToCheck: 30,
};

export const VFS_CONFIG = {
  maxConsecutiveErrors: 5,
  browserIdleTimeoutMs: 10 * 60 * 1000, // 10 minutes
  requestDelayMs: 3000, // 3 seconds between requests (rate limiting)
  pageTimeoutMs: 60000, // 60 seconds for page load
  cloudflareWaitMs: 30000, // 30 seconds max for cloudflare
  screenshotDir: './screenshots/vfs',
};

export const SCRAPER_CONFIG = {
  maxBrowsers: 8,
  pageTimeout: 20000,
  screenshotDir: './public/screenshots',
  maxConsecutiveErrors: 3,
  captchaPauseDuration: 30 * 60 * 1000, // 30 minutes
};
