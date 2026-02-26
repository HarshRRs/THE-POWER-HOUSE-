import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  // Auth
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32).optional()
    .refine(
      (val) => process.env.NODE_ENV !== 'production' || (val && val.length >= 32),
      { message: 'JWT_REFRESH_SECRET is required in production (min 32 chars)' }
    ),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('alerte@rdvpriority.fr'),
  
  // SMS (Twilio)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  
  // WhatsApp Cloud API
  WHATSAPP_PHONE_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  
  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  
  // Firebase (FCM)
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  
  // App
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('Invalid environment variables:');
    console.error(parsed.error.format());
    process.exit(1);
  }
  
  return parsed.data;
}

export const env = loadEnv();
export type Env = z.infer<typeof envSchema>;
