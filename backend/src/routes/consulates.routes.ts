import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import {
  getAllConsulates,
  getConsulateById,
  getConsulateDetections,
} from '../services/consulate.service.js';
import { sendSuccess, sendError } from '../utils/responses.util.js';

const router = Router();

// GET /api/consulates - Get all consulates
router.get(
  '/',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const consulates = await getAllConsulates();
      sendSuccess(res, consulates);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/consulates/:id - Get single consulate with details
router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const consulateId = req.params.id as string;
      const consulate = await getConsulateById(consulateId);
      if (!consulate) {
        sendError(res, 'Consulate not found', 404);
        return;
      }
      sendSuccess(res, consulate);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/consulates/:id/detections - Get recent detections for consulate
router.get(
  '/:id/detections',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const consulateId = req.params.id as string;
      const limit = parseInt(req.query.limit as string) || 10;
      const detections = await getConsulateDetections(consulateId, limit);
      sendSuccess(res, detections);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
