import webpush from 'web-push';
import { prisma } from '../../config/database.js';
import logger from '../../utils/logger.util.js';

/**
 * Push Notification Service
 * Handles Web Push notifications for the Boss Panel mobile app
 */
class PushService {
  private vapidKeys: { publicKey: string; privateKey: string } | null = null;

  constructor() {
    this.initializeVAPID();
  }

  /**
   * Initialize VAPID keys
   */
  private initializeVAPID(): void {
    // Check if keys exist in environment
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (publicKey && privateKey) {
      this.vapidKeys = { publicKey, privateKey };
    } else {
      // Generate new keys if not exists
      this.vapidKeys = webpush.generateVAPIDKeys();
      logger.info('Generated new VAPID keys. Add these to your .env file!');
    }

    // Set VAPID details
    webpush.setVapidDetails(
      'mailto:admin@rdvpriority.fr',
      this.vapidKeys!.publicKey,
      this.vapidKeys!.privateKey
    );
  }

  /**
   * Get VAPID public key for frontend
   */
  getPublicKey(): string | null {
    return this.vapidKeys?.publicKey || null;
  }

  /**
   * Save a push subscription to database
   */
  async saveSubscription(userId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }): Promise<void> {
    try {
      await prisma.pushSubscription.upsert({
        where: {
          userId_endpoint: {
            userId,
            endpoint: subscription.endpoint,
          },
        },
        update: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          updatedAt: new Date(),
        },
        create: {
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      });

      logger.info(`Push subscription saved for user: ${userId}`);
    } catch (error) {
      logger.error('Error saving push subscription:', error);
      throw error;
    }
  }

  /**
   * Remove a push subscription
   */
  async removeSubscription(endpoint: string): Promise<void> {
    try {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint },
      });

      logger.info(`Push subscription removed: ${endpoint}`);
    } catch (error) {
      logger.error('Error removing push subscription:', error);
    }
  }

  /**
   * Send notification to a specific user
   */
  async sendToUser(userId: string, title: string, options: {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
    requireInteraction?: boolean;
    actions?: Array<{ action: string; title: string }>;
  } = {}): Promise<void> {
    try {
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId },
      });

      if (subscriptions.length === 0) {
        logger.warn(`No push subscriptions found for user: ${userId}`);
        return;
      }

      const payload = JSON.stringify({
        title,
        ...options,
      });

      // Send to all user devices
      const sendPromises = subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, payload);
          logger.info(`Push notification sent to ${sub.endpoint}`);
        } catch (error: any) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            // Subscription expired or invalid, remove it
            logger.info(`Removing expired subscription: ${sub.endpoint}`);
            await this.removeSubscription(sub.endpoint);
          } else {
            logger.error('Error sending push notification:', error);
          }
        }
      });

      await Promise.all(sendPromises);
    } catch (error) {
      logger.error('Error in sendToUser:', error);
    }
  }

  /**
   * Send notification to all subscribed users
   */
  async broadcast(title: string, options: {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
    requireInteraction?: boolean;
    actions?: Array<{ action: string; title: string }>;
  } = {}): Promise<void> {
    try {
      const subscriptions = await prisma.pushSubscription.findMany();

      if (subscriptions.length === 0) {
        logger.warn('No push subscriptions found for broadcast');
        return;
      }

      const payload = JSON.stringify({
        title,
        ...options,
      });

      // Send to all subscriptions
      const sendPromises = subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, payload);
        } catch (error: any) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            await this.removeSubscription(sub.endpoint);
          }
        }
      });

      await Promise.all(sendPromises);
      logger.info(`Broadcast sent to ${subscriptions.length} devices`);
    } catch (error) {
      logger.error('Error in broadcast:', error);
    }
  }

  /**
   * Send slot detection notification
   */
  async sendSlotNotification(detection: {
    prefectureName: string;
    procedure: string;
    slotDate: string;
    slotTime: string;
    bookingUrl: string;
  }): Promise<void> {
    const title = '🔔 Nouveau créneau disponible!';
    const body = `${detection.prefectureName} - ${detection.procedure}\n${detection.slotDate} à ${detection.slotTime}`;

    await this.broadcast(title, {
      body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'slot-alert',
      requireInteraction: true,
      data: {
        url: detection.bookingUrl,
        prefecture: detection.prefectureName,
        date: detection.slotDate,
        time: detection.slotTime,
      },
      actions: [
        { action: 'open', title: 'Réserver' },
        { action: 'dismiss', title: 'Ignorer' },
      ],
    });
  }
}

export const pushService = new PushService();
