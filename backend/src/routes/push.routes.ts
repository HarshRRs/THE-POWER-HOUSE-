import { Router } from 'express';
import { pushService } from '../services/notifications/push.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import logger from '../utils/logger.util.js';

const router = Router();

/**
 * Get VAPID public key
 * GET /api/push/vapid-public-key
 */
router.get('/vapid-public-key', (req, res) => {
  const publicKey = pushService.getPublicKey();
  
  if (!publicKey) {
    return res.status(500).json({ 
      error: 'VAPID keys not configured',
      message: 'Server needs VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in environment'
    });
  }

  res.json({ publicKey });
});

/**
 * Subscribe to push notifications
 * POST /api/push/subscribe
 */
router.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    const subscription = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ 
        error: 'Invalid subscription data',
        message: 'Subscription must include endpoint and keys'
      });
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
router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ 
        error: 'Endpoint required',
        message: 'Subscription endpoint is required'
      });
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
