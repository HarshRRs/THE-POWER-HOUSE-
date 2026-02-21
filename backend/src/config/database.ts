import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.util.js';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Parse DATABASE_URL to add connection pool parameters
function getDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL || '';
  
  // Default connection pool settings for production
  const poolParams = new URLSearchParams({
    connection_limit: process.env.DATABASE_POOL_SIZE || '10',
    pool_timeout: process.env.DATABASE_POOL_TIMEOUT || '10',
  });

  // Check if URL already has query params
  const separator = baseUrl.includes('?') ? '&' : '?';
  
  return `${baseUrl}${separator}${poolParams.toString()}`;
}

// Create Prisma client with optimized settings
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });
}

export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
    
    // Log pool configuration in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Database pool size: ${process.env.DATABASE_POOL_SIZE || 10}`);
    }
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}

/**
 * Execute a raw query with timeout
 */
export async function executeWithTimeout<T>(
  query: Promise<T>,
  timeoutMs = 5000
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Query timeout')), timeoutMs);
  });
  
  return Promise.race([query, timeout]);
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await executeWithTimeout(prisma.$queryRaw`SELECT 1`, 3000);
    return true;
  } catch {
    return false;
  }
}
