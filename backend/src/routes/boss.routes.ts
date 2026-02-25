import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { analyticsService } from '../services/analytics.service.js';
import { websocketService } from '../services/websocket.service.js';
import logger from '../utils/logger.util.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * Boss Panel API Routes
 * Private endpoints for the high-tech monitoring dashboard
 */

// Get all prefectures with live status
router.get('/prefectures', async (req, res) => {
  try {
    const prefectures = await prisma.prefecture.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        department: true,
        region: true,
        tier: true,
        bookingUrl: true,
        lastScrapedAt: true,
        lastSlotFoundAt: true,
      },
      orderBy: [{ tier: 'asc' }, { name: 'asc' }],
    });

    // Get latest detection for each prefecture
    const latestDetections = await prisma.detection.findMany({
      where: {
        prefectureId: { in: prefectures.map(p => p.id) },
      },
      orderBy: { detectedAt: 'desc' },
      distinct: ['prefectureId'],
      select: {
        prefectureId: true,
        slotDate: true,
        slotTime: true,
        slotsAvailable: true,
        detectedAt: true,
      },
    });

    const detectionMap = new Map(latestDetections.map(d => [d.prefectureId, d]));

    const enrichedPrefectures = prefectures.map(p => {
      const detection = detectionMap.get(p.id);
      return {
        ...p,
        latestSlot: detection || null,
        status: detection 
          ? (Date.now() - detection.detectedAt.getTime() < 3600000 ? 'hot' : 'warm')
          : 'cold',
      };
    });

    res.json(enrichedPrefectures);
  } catch (error) {
    logger.error('Error fetching prefectures:', error);
    res.status(500).json({ error: 'Failed to fetch prefectures' });
  }
});

// Get heat map data
router.get('/heatmap', async (req, res) => {
  try {
    const heatmapData = await analyticsService.getHeatMapData();
    res.json(heatmapData);
  } catch (error) {
    logger.error('Error fetching heatmap:', error);
    res.status(500).json({ error: 'Failed to fetch heatmap data' });
  }
});

// Get live slot stream
router.get('/slot-stream', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const stream = await analyticsService.getSlotStream(limit);
    res.json(stream);
  } catch (error) {
    logger.error('Error fetching slot stream:', error);
    res.status(500).json({ error: 'Failed to fetch slot stream' });
  }
});

// Get predictive analytics for a prefecture
router.get('/predict/:prefectureId', async (req, res) => {
  try {
    const { prefectureId } = req.params;
    const prediction = await analyticsService.predictNextSlot(prefectureId);
    
    if (!prediction) {
      return res.json({ 
        prediction: null,
        message: 'Not enough data for prediction' 
      });
    }

    res.json({
      prediction: {
        ...prediction,
        predictedTime: prediction.predictedTime.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error fetching prediction:', error);
    res.status(500).json({ error: 'Failed to fetch prediction' });
  }
});

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await analyticsService.getStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get prefecture details with history
router.get('/prefecture/:id/details', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [prefecture, detections, prediction] = await Promise.all([
      prisma.prefecture.findUnique({
        where: { id },
      }),
      prisma.detection.findMany({
        where: { prefectureId: id },
        orderBy: { detectedAt: 'desc' },
        take: 20,
      }),
      analyticsService.predictNextSlot(id),
    ]);

    if (!prefecture) {
      return res.status(404).json({ error: 'Prefecture not found' });
    }

    res.json({
      prefecture,
      recentDetections: detections,
      prediction: prediction ? {
        ...prediction,
        predictedTime: prediction.predictedTime.toISOString(),
      } : null,
    });
  } catch (error) {
    logger.error('Error fetching prefecture details:', error);
    res.status(500).json({ error: 'Failed to fetch details' });
  }
});

// Trigger manual check (for testing)
router.post('/prefecture/:id/check', async (req, res) => {
  try {
    const { id } = req.params;
    // TODO: Trigger scraper job for this prefecture
    res.json({ message: 'Check triggered', prefectureId: id });
  } catch (error) {
    logger.error('Error triggering check:', error);
    res.status(500).json({ error: 'Failed to trigger check' });
  }
});

// Get active WebSocket connections (monitoring)
router.get('/connections', (req, res) => {
  res.json({
    activeConnections: websocketService.getActiveConnections(),
  });
});

export default router;
