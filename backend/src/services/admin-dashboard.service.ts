/**
 * Admin Dashboard Service
 * Optimized dashboard data aggregation with caching
 * Replaces 12 parallel queries with 2-3 optimized queries + caching
 */

import { prisma } from '../config/database.js';
import { withCache, deleteCache } from './cache.service.js';
import logger from '../utils/logger.util.js';

const DASHBOARD_CACHE_KEY = 'cache:admin:dashboard';
const DASHBOARD_CACHE_TTL = 30; // 30 seconds

export interface DashboardStats {
  users: {
    total: number;
    activeSubscribers: number;
    newThisWeek: number;
    byPlan: Record<string, number>;
  };
  alerts: {
    total: number;
    active: number;
  };
  detections: {
    today: number;
    thisWeek: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
  };
  scraper: {
    activePrefectures: number;
    erroredPrefectures: number;
  };
}

/**
 * Get dashboard stats with caching
 * Reduces 12 queries to 2-3 optimized queries
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  return withCache(DASHBOARD_CACHE_KEY, fetchDashboardStats, {
    ttl: DASHBOARD_CACHE_TTL,
  });
}

/**
 * Invalidate dashboard cache (call after significant data changes)
 */
export async function invalidateDashboardCache(): Promise<void> {
  await deleteCache(DASHBOARD_CACHE_KEY);
  logger.debug('Admin dashboard cache invalidated');
}

/**
 * Fetch dashboard stats from database
 * Optimized query strategy using raw SQL for aggregations
 */
async function fetchDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Query 1: User stats (single query with multiple aggregations)
  const userStats = await prisma.$queryRaw<Array<{
    total: bigint;
    active_subscribers: bigint;
    new_this_week: bigint;
    plan_none: bigint;
    plan_urgence_24h: bigint;
    plan_urgence_7j: bigint;
    plan_urgence_total: bigint;
  }>>`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE plan != 'NONE' AND "planExpiresAt" > NOW()) as active_subscribers,
      COUNT(*) FILTER (WHERE "createdAt" >= ${weekAgo}) as new_this_week,
      COUNT(*) FILTER (WHERE plan = 'NONE') as plan_none,
      COUNT(*) FILTER (WHERE plan = 'URGENCE_24H') as plan_urgence_24h,
      COUNT(*) FILTER (WHERE plan = 'URGENCE_7J') as plan_urgence_7j,
      COUNT(*) FILTER (WHERE plan = 'URGENCE_TOTAL') as plan_urgence_total
    FROM "User"
  `;

  // Query 2: Alert and Detection stats
  const alertStats = await prisma.$queryRaw<Array<{
    total_alerts: bigint;
    active_alerts: bigint;
    detections_today: bigint;
    detections_week: bigint;
  }>>`
    SELECT 
      (SELECT COUNT(*) FROM "Alert") as total_alerts,
      (SELECT COUNT(*) FROM "Alert" WHERE "isActive" = true) as active_alerts,
      (SELECT COUNT(*) FROM "Detection" WHERE "detectedAt" >= ${dayAgo}) as detections_today,
      (SELECT COUNT(*) FROM "Detection" WHERE "detectedAt" >= ${weekAgo}) as detections_week
  `;

  // Query 3: Revenue and Prefecture stats
  const revenueAndPrefStats = await prisma.$queryRaw<Array<{
    total_revenue: number | null;
    monthly_revenue: number | null;
    active_prefectures: bigint;
    errored_prefectures: bigint;
  }>>`
    SELECT 
      (SELECT COALESCE(SUM(amount), 0) FROM "Payment" WHERE status = 'COMPLETED') as total_revenue,
      (SELECT COALESCE(SUM(amount), 0) FROM "Payment" WHERE status = 'COMPLETED' AND "paidAt" >= ${monthStart}) as monthly_revenue,
      (SELECT COUNT(*) FROM "Prefecture" WHERE status = 'ACTIVE') as active_prefectures,
      (SELECT COUNT(*) FROM "Prefecture" WHERE status IN ('ERROR', 'CAPTCHA')) as errored_prefectures
  `;

  const user = userStats[0];
  const alert = alertStats[0];
  const revenuePref = revenueAndPrefStats[0];

  return {
    users: {
      total: Number(user.total),
      activeSubscribers: Number(user.active_subscribers),
      newThisWeek: Number(user.new_this_week),
      byPlan: {
        URGENCE_24H: Number(user.plan_urgence_24h),
        URGENCE_7J: Number(user.plan_urgence_7j),
        URGENCE_TOTAL: Number(user.plan_urgence_total),
      },
    },
    alerts: {
      total: Number(alert.total_alerts),
      active: Number(alert.active_alerts),
    },
    detections: {
      today: Number(alert.detections_today),
      thisWeek: Number(alert.detections_week),
    },
    revenue: {
      total: revenuePref.total_revenue || 0,
      thisMonth: revenuePref.monthly_revenue || 0,
    },
    scraper: {
      activePrefectures: Number(revenuePref.active_prefectures),
      erroredPrefectures: Number(revenuePref.errored_prefectures),
    },
  };
}

/**
 * Get dashboard stats without cache (for real-time needs)
 */
export async function getDashboardStatsNoCache(): Promise<DashboardStats> {
  return fetchDashboardStats();
}
