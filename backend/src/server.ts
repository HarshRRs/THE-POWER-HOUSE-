// Sentry must be initialized first, before any other imports that might throw
import { initSentry, setupSentryMiddleware, setupSentryErrorHandler } from './config/sentry.js';
initSentry();

import express from 'express';
import crypto from 'crypto';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware.js';
import { generalLimiter } from './middleware/rateLimiter.middleware.js';
import { csrfProtection, getCsrfToken } from './middleware/csrf.middleware.js';
import { metricsMiddleware } from './middleware/metrics.middleware.js';
import metricsRoutes from './routes/metrics.routes.js';
import { verifyToken } from './utils/jwt.util.js';
import { initializeWebSocket } from './services/notifications/websocket.service.js';
import logger from './utils/logger.util.js';

const app = express();
const httpServer = createServer(app);

// Sentry request handler must be first middleware
setupSentryMiddleware(app);

// Allowed origins for CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  process.env.ADMIN_URL || 'http://localhost:3001',
].filter(Boolean);

// Socket.io setup with JWT auth
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  
  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const payload = verifyToken(token as string);
    socket.data.user = payload;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  const userId = socket.data.user?.id;
  const userRole = socket.data.user?.role;
  
  if (userId) {
    socket.join(`user:${userId}`);
    logger.info(`WebSocket connected: user ${userId}`);

    // Join admin room if admin
    if (userRole === 'ADMIN') {
      socket.join('admin');
      logger.info(`Admin user ${userId} joined admin room`);
    }
  }

  socket.on('disconnect', () => {
    logger.info(`WebSocket disconnected: user ${userId}`);
  });
});

// Initialize WebSocket service with io instance
initializeWebSocket(io);

// Request ID middleware
app.use((req, _res, next) => {
  req.requestId = crypto.randomUUID();
  next();
});

// Middleware
app.use(helmet());
app.use(cookieParser());
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Metrics collection (before other middleware to capture all requests)
app.use(metricsMiddleware);

// Metrics endpoint (no auth required for Prometheus scraping)
app.use('/api/metrics', metricsRoutes);

// Raw body for Stripe webhooks (must be before express.json())
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));

// JSON parsing for all other routes
app.use(express.json());

// Rate limiting
app.use('/api', generalLimiter);

// CSRF protection (after cookie parser, before routes)
app.get('/api/csrf-token', getCsrfToken);
app.use('/api', csrfProtection);

// Serve static files (screenshots)
app.use('/screenshots', express.static('public/screenshots'));

// API routes
app.use('/api', routes);

// Error handling - Sentry must capture errors before our handler
app.use(notFoundHandler);
setupSentryErrorHandler(app);
app.use(errorHandler);

export { app, httpServer, io };
