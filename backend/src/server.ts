import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware.js';
import { generalLimiter } from './middleware/rateLimiter.middleware.js';
import { verifyToken } from './utils/jwt.util.js';
import { initializeWebSocket } from './services/notifications/websocket.service.js';
import logger from './utils/logger.util.js';

const app = express();
const httpServer = createServer(app);

// Socket.io setup with JWT auth
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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
  
  if (userId) {
    socket.join(`user:${userId}`);
    logger.info(`WebSocket connected: user ${userId}`);
  }

  socket.on('disconnect', () => {
    logger.info(`WebSocket disconnected: user ${userId}`);
  });
});

// Initialize WebSocket service with io instance
initializeWebSocket(io);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Raw body for Stripe webhooks (must be before express.json())
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));

// JSON parsing for all other routes
app.use(express.json());

// Rate limiting
app.use('/api', generalLimiter);

// Serve static files (screenshots)
app.use('/screenshots', express.static('public/screenshots'));

// API routes
app.use('/api', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export { app, httpServer, io };
