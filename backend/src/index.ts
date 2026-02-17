import 'dotenv/config';
import { httpServer } from './server.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import logger from './utils/logger.util.js';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  try {
    // Connect to databases
    try {
      await connectDatabase();
    } catch (e) {
      logger.warn('Database connection failed, starting in offline mode:', e);
    }

    try {
      await connectRedis();
    } catch (e) {
      logger.warn('Redis connection failed, starting in offline mode:', e);
    }

    // Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info(`RDVPriority API running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down gracefully...');

  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  await disconnectDatabase();
  await disconnectRedis();

  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

bootstrap();
