import { Router } from 'express';
import authRoutes from './auth.routes.js';
import alertsRoutes from './alerts.routes.js';
import prefecturesRoutes from './prefectures.routes.js';
import consulatesRoutes from './consulates.routes.js';
import vfsRoutes from './vfs.routes.js';
import usersRoutes from './users.routes.js';
import healthRoutes from './health.routes.js';
import billingRoutes from './billing.routes.js';
import telegramRoutes from './telegram.routes.js';
import adminRoutes from './admin.routes.js';
import bossRoutes from './boss.routes.js';
import pushRoutes from './push.routes.js';
import bookingRoutes from './booking.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/alerts', alertsRoutes);
router.use('/prefectures', prefecturesRoutes);
router.use('/consulates', consulatesRoutes);
router.use('/vfs', vfsRoutes);
router.use('/users', usersRoutes);
router.use('/health', healthRoutes);
router.use('/billing', billingRoutes);
router.use('/telegram', telegramRoutes);
router.use('/admin', adminRoutes);
router.use('/boss', bossRoutes); // Boss Panel API
router.use('/push', pushRoutes); // Push notifications API
router.use('/booking', bookingRoutes); // Auto-booking API

// Stats endpoint (alias to health/stats)
router.get('/stats', (_req, res) => {
  res.redirect('/api/health/stats');
});

export default router;
