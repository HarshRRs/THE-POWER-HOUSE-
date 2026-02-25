import { Router } from 'express';
import authRoutes from './auth.routes.js';
import alertsRoutes from './alerts.routes.js';
import prefecturesRoutes from './prefectures.routes.js';
import usersRoutes from './users.routes.js';
import healthRoutes from './health.routes.js';
import billingRoutes from './billing.routes.js';
import telegramRoutes from './telegram.routes.js';
import adminRoutes from './admin.routes.js';
import bossRoutes from './boss.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/alerts', alertsRoutes);
router.use('/prefectures', prefecturesRoutes);
router.use('/users', usersRoutes);
router.use('/health', healthRoutes);
router.use('/billing', billingRoutes);
router.use('/telegram', telegramRoutes);
router.use('/admin', adminRoutes);
router.use('/boss', bossRoutes); // Boss Panel API

// Stats endpoint (alias to health/stats)
router.get('/stats', (_req, res) => {
  res.redirect('/api/health/stats');
});

export default router;
