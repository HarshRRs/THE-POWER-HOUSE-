import { Router } from 'express';
import { pushService } from '../services/notifications/push.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import logger from '../utils/logger.util.js';

const router = Router();

/**
 * Get VAPID public key
 * GET /api/push/vapid-public-key
 */
router.get('/vapid-public-key', (_req, res): void => {
  const publicKey = pushService.getPublicKey();
  
  if (!publicKey) {
    res.status(500).json({ 
      error: 'VAPID keys not configured',
      message: 'Server needs VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in environment'
    });
    return;
  }

  res.json({ publicKey });
});

/**
 * Subscribe to push notifications
 * POST /api/push/subscribe
 */
router.post('/subscribe', authMiddleware, async (req, res): Promise<void> => {
  try {
    const userId = req.user!.id;
    const subscription = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      res.status(400).json({ 
        error: 'Invalid subscription data',
        message: 'Subscription must include endpoint and keys'
      });
      return;
    }

    await pushService.saveSubscription(userId, subscription);

    logger.info(`User ${userId} subscribed to push notifications`);
    
    res.json({ 
      success: true,
      message: 'Subscribed to push notifications'
    });
  } catch (error) {
    logger.error('Error subscribing to push:', error);
    res.status(500).json({ 
      error: 'Failed to subscribe',
      message: 'Internal server error'
    });
  }
});

/**
 * Unsubscribe from push notifications
 * POST /api/push/unsubscribe
 */
router.post('/unsubscribe', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      res.status(400).json({ 
        error: 'Endpoint required',
        message: 'Subscription endpoint is required'
      });
      return;
    }

    await pushService.removeSubscription(endpoint);

    logger.info(`Subscription removed: ${endpoint}`);
    
    res.json({ 
      success: true,
      message: 'Unsubscribed from push notifications'
    });
  } catch (error) {
    logger.error('Error unsubscribing from push:', error);
    res.status(500).json({ 
      error: 'Failed to unsubscribe',
      message: 'Internal server error'
    });
  }
});

/**
 * Send test notification (for debugging)
 * POST /api/push/test
 */
router.post('/test', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;

    await pushService.sendToUser(userId, '🔔 Test Notification', {
      body: 'This is a test notification from RDVPriority!',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'test',
      requireInteraction: true,
      actions: [
        { action: 'open', title: 'Open' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    });

    res.json({ 
      success: true,
      message: 'Test notification sent'
    });
  } catch (error) {
    logger.error('Error sending test notification:', error);
    res.status(500).json({ 
      error: 'Failed to send test notification',
      message: 'Internal server error'
    });
  }
});

export default router;
