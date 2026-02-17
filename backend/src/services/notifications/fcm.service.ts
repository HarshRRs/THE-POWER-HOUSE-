import admin from 'firebase-admin';
import logger from '../../utils/logger.util.js';

let firebaseInitialized = false;

// Initialize Firebase Admin SDK
if (
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    firebaseInitialized = true;
    logger.info('Firebase Admin SDK initialized');
  } catch (error) {
    logger.error('Firebase initialization error:', error);
  }
}

export interface FcmOptions {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  icon?: string;
}

export async function sendFcm(options: FcmOptions): Promise<{ success: number; failure: number }> {
  if (!firebaseInitialized) {
    logger.warn('FCM service not configured (Firebase credentials missing)');
    return { success: 0, failure: options.tokens.length };
  }

  if (options.tokens.length === 0) {
    return { success: 0, failure: 0 };
  }

  try {
    const message: admin.messaging.MulticastMessage = {
      tokens: options.tokens,
      notification: {
        title: options.title,
        body: options.body,
      },
      data: options.data,
      webpush: {
        notification: {
          icon: options.icon || '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          vibrate: [200, 100, 200],
          requireInteraction: true,
        },
        fcmOptions: {
          link: options.data?.bookingUrl || process.env.FRONTEND_URL || 'https://rdvpriority.fr',
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    logger.info(`FCM sent: ${response.successCount} success, ${response.failureCount} failure`);

    // Log failed tokens for cleanup
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error) {
          logger.debug(`FCM failed for token ${idx}: ${resp.error.message}`);
        }
      });
    }

    return { 
      success: response.successCount, 
      failure: response.failureCount 
    };
  } catch (error) {
    logger.error('FCM sending error:', error);
    return { success: 0, failure: options.tokens.length };
  }
}

export function isFcmConfigured(): boolean {
  return firebaseInitialized;
}

// Get invalid tokens from a failed send (for cleanup)
export function getInvalidTokens(
  tokens: string[],
  responses: admin.messaging.SendResponse[]
): string[] {
  const invalidTokens: string[] = [];
  
  responses.forEach((resp, idx) => {
    if (!resp.success && resp.error) {
      const errorCode = resp.error.code;
      if (
        errorCode === 'messaging/invalid-registration-token' ||
        errorCode === 'messaging/registration-token-not-registered'
      ) {
        invalidTokens.push(tokens[idx]);
      }
    }
  });

  return invalidTokens;
}
