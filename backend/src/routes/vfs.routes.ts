import { Router } from 'express';
import type { Request, Response } from 'express';
import * as vfsService from '../services/vfs.service.js';
import { getAllVfsConfigs, getVfsConfig } from '../scraper/vfs/index.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import logger from '../utils/logger.util.js';

const router = Router();

/**
 * GET /api/vfs
 * Get all VFS centers
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const centers = await vfsService.getAllVfsCenters();
    res.json({ centers });
  } catch (error) {
    logger.error('Error fetching VFS centers:', error);
    res.status(500).json({ error: 'Failed to fetch VFS centers' });
  }
});

/**
 * GET /api/vfs/configs
 * Get all VFS configurations (static config data)
 */
router.get('/configs', async (_req: Request, res: Response) => {
  try {
    const configs = getAllVfsConfigs();
    res.json({ configs });
  } catch (error) {
    logger.error('Error fetching VFS configs:', error);
    res.status(500).json({ error: 'Failed to fetch VFS configs' });
  }
});

/**
 * GET /api/vfs/configs/:configId
 * Get a specific VFS configuration
 */
router.get('/configs/:configId', async (req: Request, res: Response) => {
  try {
    const configId = req.params.configId as string;
    const config = getVfsConfig(configId);
    if (!config) {
      res.status(404).json({ error: 'VFS config not found' });
      return;
    }
    res.json({ config });
  } catch (error) {
    logger.error('Error fetching VFS config:', error);
    res.status(500).json({ error: 'Failed to fetch VFS config' });
  }
});

/**
 * GET /api/vfs/active
 * Get active VFS centers only
 */
router.get('/active', async (_req: Request, res: Response) => {
  try {
    const centers = await vfsService.getActiveVfsCenters();
    res.json({ centers });
  } catch (error) {
    logger.error('Error fetching active VFS centers:', error);
    res.status(500).json({ error: 'Failed to fetch active VFS centers' });
  }
});

/**
 * GET /api/vfs/country/:country
 * Get VFS centers by destination country
 */
router.get('/country/:country', async (req: Request, res: Response) => {
  try {
    const country = req.params.country as string;
    const centers = await vfsService.getVfsCentersByCountry(country);
    res.json({ centers });
  } catch (error) {
    logger.error('Error fetching VFS centers by country:', error);
    res.status(500).json({ error: 'Failed to fetch VFS centers' });
  }
});

/**
 * GET /api/vfs/stats
 * Get VFS center statistics (admin only)
 */
router.get('/stats', authMiddleware, adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const stats = await vfsService.getVfsCenterStats();
    res.json({ stats });
  } catch (error) {
    logger.error('Error fetching VFS stats:', error);
    res.status(500).json({ error: 'Failed to fetch VFS stats' });
  }
});

/**
 * GET /api/vfs/:id
 * Get a specific VFS center
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const center = await vfsService.getVfsCenterById(id);
    if (!center) {
      res.status(404).json({ error: 'VFS center not found' });
      return;
    }
    res.json({ center });
  } catch (error) {
    logger.error('Error fetching VFS center:', error);
    res.status(500).json({ error: 'Failed to fetch VFS center' });
  }
});

/**
 * PATCH /api/vfs/:id/status
 * Update VFS center status (admin only)
 */
router.patch('/:id/status', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const id = req.params.id as string;
    
    if (!['ACTIVE', 'PAUSED', 'ERROR', 'CAPTCHA_BLOCKED'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const center = await vfsService.updateVfsCenterStatus(id, status);
    res.json({ center });
  } catch (error) {
    logger.error('Error updating VFS center status:', error);
    res.status(500).json({ error: 'Failed to update VFS center status' });
  }
});

/**
 * POST /api/vfs/sync
 * Sync VFS centers from config to database (admin only)
 */
router.post('/sync', authMiddleware, adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const result = await vfsService.syncVfsCentersFromConfig();
    res.json({ 
      message: 'VFS centers synced successfully',
      ...result 
    });
  } catch (error) {
    logger.error('Error syncing VFS centers:', error);
    res.status(500).json({ error: 'Failed to sync VFS centers' });
  }
});

/**
 * POST /api/vfs/alerts
 * Create VFS alerts for a client (admin only)
 */
router.post('/alerts', async (req: Request, res: Response) => {
  try {
    const { clientName, clientEmail, configId, centerIds, categoryIds } = req.body;
    
    // Validate required fields
    if (!clientName || typeof clientName !== 'string') {
      res.status(400).json({ error: 'clientName is required' });
      return;
    }
    if (!configId || typeof configId !== 'string') {
      res.status(400).json({ error: 'configId is required' });
      return;
    }
    if (!Array.isArray(centerIds) || centerIds.length === 0) {
      res.status(400).json({ error: 'centerIds array is required' });
      return;
    }
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      res.status(400).json({ error: 'categoryIds array is required' });
      return;
    }

    const result = await vfsService.createVfsAlerts({
      clientName: clientName.trim(),
      clientEmail: clientEmail?.trim() || null,
      configId,
      centerIds,
      categoryIds,
    });

    res.json(result);
  } catch (error) {
    logger.error('Error creating VFS alerts:', error);
    const message = error instanceof Error ? error.message : 'Failed to create VFS alerts';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/vfs/alerts
 * Get all VFS alerts (admin only)
 */
router.get('/alerts', async (_req: Request, res: Response) => {
  try {
    const alerts = await vfsService.getVfsAlerts();
    res.json({ alerts });
  } catch (error) {
    logger.error('Error fetching VFS alerts:', error);
    res.status(500).json({ error: 'Failed to fetch VFS alerts' });
  }
});

export default router;
