import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { 
  getAllPrefectures, 
  getPrefectureById, 
  getRecentDetections 
} from '../services/prefecture.service.js';
import { sendSuccess, sendError } from '../utils/responses.util.js';

const router = Router();

// GET /api/prefectures - Get all prefectures
router.get(
  '/',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const prefectures = await getAllPrefectures();
      sendSuccess(res, prefectures);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/prefectures/:id - Get single prefecture with details
router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const prefectureId = req.params.id as string;
      const prefecture = await getPrefectureById(prefectureId);
      if (!prefecture) {
        sendError(res, 'Prefecture not found', 404);
        return;
      }
      sendSuccess(res, prefecture);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/prefectures/:id/detections - Get recent detections for prefecture
router.get(
  '/:id/detections',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const prefectureId = req.params.id as string;
      const limit = parseInt(req.query.limit as string) || 10;
      const detections = await getRecentDetections(prefectureId, limit);
      sendSuccess(res, detections);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
