import { z } from 'zod';

// Max pagination limits for safety
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

// Enum values from Prisma schema
const PlanEnum = z.enum(['NONE', 'URGENCE_24H', 'URGENCE_7J', 'URGENCE_TOTAL']);
const RoleEnum = z.enum(['USER', 'ADMIN']);
const PrefectureStatusEnum = z.enum(['ACTIVE', 'PAUSED', 'ERROR', 'CAPTCHA']);
const PaymentStatusEnum = z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']);

// Common pagination schema
const paginationSchema = z.object({
  page: z.string().optional().transform((val) => {
    const num = parseInt(val || '1', 10);
    return Math.max(1, isNaN(num) ? 1 : num);
  }),
  limit: z.string().optional().transform((val) => {
    const num = parseInt(val || String(DEFAULT_PAGE_SIZE), 10);
    return Math.min(MAX_PAGE_SIZE, Math.max(1, isNaN(num) ? DEFAULT_PAGE_SIZE : num));
  }),
});

// UUID validation for route params
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

// ──────────────────────────────────────
// User List Query Schema
// ──────────────────────────────────────
export const userListQuerySchema = paginationSchema.extend({
  search: z.string().max(255).optional(),
  plan: z.union([z.literal('ALL'), PlanEnum]).optional(),
  sortBy: z.enum(['createdAt', 'planExpiresAt', 'email']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ──────────────────────────────────────
// User Update Body Schema
// ──────────────────────────────────────
export const userUpdateSchema = z.object({
  plan: PlanEnum.optional(),
  planExpiresAt: z.string().datetime().optional().nullable(),
  role: RoleEnum.optional(),
});

// ──────────────────────────────────────
// Prefecture List Query Schema
// ──────────────────────────────────────
export const prefectureListQuerySchema = z.object({
  status: z.union([z.literal('ALL'), PrefectureStatusEnum]).optional(),
});

// ──────────────────────────────────────
// Prefecture Update Body Schema
// ──────────────────────────────────────
export const prefectureUpdateSchema = z.object({
  status: PrefectureStatusEnum.optional(),
  checkInterval: z.number().int().min(10).max(3600).optional(),
  selectors: z.record(z.string(), z.unknown()).optional(),
  consecutiveErrors: z.number().int().min(0).optional(),
});

// ──────────────────────────────────────
// Payments List Query Schema
// ──────────────────────────────────────
export const paymentsQuerySchema = paginationSchema.extend({
  status: z.union([z.literal('ALL'), PaymentStatusEnum]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ──────────────────────────────────────
// Logs List Query Schema
// ──────────────────────────────────────
export const logsQuerySchema = paginationSchema.extend({
  prefectureId: z.string().optional(),
  status: z.string().max(50).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Type exports
export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type PrefectureListQuery = z.infer<typeof prefectureListQuerySchema>;
export type PrefectureUpdateInput = z.infer<typeof prefectureUpdateSchema>;
export type PaymentsQuery = z.infer<typeof paymentsQuerySchema>;
export type LogsQuery = z.infer<typeof logsQuerySchema>;
