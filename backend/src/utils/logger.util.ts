import winston from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const isProduction = process.env.NODE_ENV === 'production';

const devFormat = printf(({ level, message, timestamp, stack, requestId, userId, ...rest }) => {
  let log = `${timestamp} [${level}]`;
  if (requestId) log += ` [${requestId}]`;
  if (userId) log += ` [user:${userId}]`;
  log += `: ${stack || message}`;
  const extra = Object.keys(rest).filter(k => k !== 'service').length;
  if (extra > 0) {
    const filtered = Object.fromEntries(Object.entries(rest).filter(([k]) => k !== 'service'));
    if (Object.keys(filtered).length > 0) log += ` ${JSON.stringify(filtered)}`;
  }
  return log;
});

export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  defaultMeta: { service: 'rdvpriority-api' },
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    isProduction ? json() : devFormat,
  ),
  transports: [
    new winston.transports.Console({
      format: isProduction
        ? combine(json())
        : combine(colorize(), devFormat),
    }),
  ],
});

if (isProduction) {
  logger.add(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));
  logger.add(new winston.transports.File({ filename: 'logs/combined.log' }));
}

export default logger;
