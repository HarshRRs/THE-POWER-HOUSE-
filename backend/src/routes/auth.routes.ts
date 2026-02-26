import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import {
  registerUser,
  loginUser,
  getUserById,
  refreshAccessToken,
  revokeRefreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
} from '../services/auth.service.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { authLimiter, refreshLimiter } from '../middleware/rateLimiter.middleware.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/auth.validator.js';
import { sendSuccess, sendError, sendMessage } from '../utils/responses.util.js';
import { REFRESH_TOKEN_DURATION_MS } from '../utils/jwt.util.js';

const router = Router();

const isProduction = process.env.NODE_ENV === 'production';

// Cookie configuration for refresh token
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict' as const,
  maxAge: REFRESH_TOKEN_DURATION_MS,
  path: '/api/auth',
};

// POST /api/auth/register
router.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await registerUser(req.body);
      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
      // Return only access token and user in response body
      sendSuccess(res, { 
        accessToken: result.accessToken, 
        user: result.user 
      }, 201);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await loginUser(req.body);
      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
      // Return only access token in response body
      sendSuccess(res, { 
        accessToken: result.accessToken, 
        user: result.user 
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/refresh - Refresh access token
router.post(
  '/refresh',
  refreshLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Read refresh token from httpOnly cookie (preferred) or body (fallback for migration)
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!refreshToken) {
        sendError(res, 'Refresh token required', 400);
        return;
      }
      const tokens = await refreshAccessToken(refreshToken);
      // Set new refresh token as httpOnly cookie
      res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
      // Return only access token in response body
      sendSuccess(res, { accessToken: tokens.accessToken });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/logout - Revoke refresh token
router.post(
  '/logout',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Read refresh token from cookie or body
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (refreshToken) {
        await revokeRefreshToken(refreshToken);
      }
      // Clear the refresh token cookie
      res.clearCookie('refreshToken', { path: '/api/auth' });
      sendMessage(res, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  authLimiter,
  validateBody(forgotPasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await forgotPassword(req.body.email);
      // Always return success to prevent email enumeration
      sendMessage(res, 'If an account exists with this email, a reset link has been sent.');
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  authLimiter,
  validateBody(resetPasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await resetPassword(req.body.token, req.body.password);
      sendMessage(res, 'Password reset successfully. Please log in again.');
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/auth/verify-email/:token
router.get(
  '/verify-email/:token',
  async (req: Request, res: Response, _next: NextFunction) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    try {
      await verifyEmail(req.params.token as string);
      res.redirect(`${frontendUrl}/dashboard?verified=true`);
    } catch {
      res.redirect(`${frontendUrl}/login?verify_error=true`);
    }
  }
);

// POST /api/auth/resend-verification
router.post(
  '/resend-verification',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        sendError(res, 'Not authenticated', 401);
        return;
      }
      await resendVerificationEmail(req.user.id);
      sendMessage(res, 'Verification email sent.');
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/auth/me
router.get(
  '/me',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        sendError(res, 'Not authenticated', 401);
        return;
      }
      const user = await getUserById(req.user.id);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
