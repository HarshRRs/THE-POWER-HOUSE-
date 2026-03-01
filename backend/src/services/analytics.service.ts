import { prisma } from '../config/database.js';
import logger from '../utils/logger.util.js';

/**
 * Analytics Service for Predictive Slot Detection
 * Uses historical data to predict when slots will appear
 */
class AnalyticsService {
  /**
   * Predict next slot availability for a prefecture
   */
  async predictNextSlot(prefectureId: string): Promise<{
    predictedTime: Date;
    confidence: number;
    reason: string;
  } | null> {
    try {
      // Get last 30 days of slot detections
      const history = await prisma.detection.findMany({
        where: {
          prefectureId,
          detectedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { detectedAt: 'asc' },
      });

      if (history.length < 5) {
        return null; // Not enough data
      }

      // Analyze patterns
      const patterns = this.analyzePatterns(history);
      
      // Calculate prediction
      const lastSlot = history[history.length - 1];
      const avgInterval = this.calculateAverageInterval(history);
      
      // Adjust for time of day patterns
      const timeOfDay = this.getTimeOfDayPattern(history);
      
      const predictedTime = new Date(lastSlot.detectedAt.getTime() + avgInterval);
      
      // Adjust to next likely time slot
      if (timeOfDay.morning) {
        predictedTime.setHours(9, 0, 0, 0);
      } else if (timeOfDay.afternoon) {
        predictedTime.setHours(14, 0, 0, 0);
      }

      const confidence = Math.min(90, 50 + (history.length * 2));

      return {
        predictedTime,
        confidence,
        reason: this.generateReason(patterns, timeOfDay),
      };
    } catch (error) {
      logger.error('Error predicting slot:', error);
      return null;
    }
  }

  /**
   * Get heat map data for all prefectures
   */
  async getHeatMapData(): Promise<Array<{
    prefectureId: string;
    name: string;
    department: string;
    region: string;
    status: 'hot' | 'warm' | 'cold';
    lastSlotFoundAt: Date | null;
    slotsFound24h: number;
    coordinates?: { lat: number; lng: number };
  }>> {
    try {
      const prefectures = await prisma.prefecture.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          department: true,
          region: true,
          lastSlotFoundAt: true,
        },
      });

      // Get slot counts for last 24 hours
      const slotCounts = await prisma.detection.groupBy({
        by: ['prefectureId'],
        where: {
          detectedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        _count: { id: true },
      });

      const countsMap = new Map(slotCounts.map(s => [s.prefectureId, s._count.id]));

      return prefectures.map(p => {
        const slotsFound24h = countsMap.get(p.id) || 0;
        
        // Determine status
        let status: 'hot' | 'warm' | 'cold' = 'cold';
        if (slotsFound24h >= 5) status = 'hot';
        else if (slotsFound24h >= 1) status = 'warm';

        return {
          prefectureId: p.id,
          name: p.name,
          department: p.department,
          region: p.region,
          status,
          lastSlotFoundAt: p.lastSlotFoundAt,
          slotsFound24h,
          coordinates: this.getCoordinates(p.department),
        };
      });
    } catch (error) {
      logger.error('Error getting heat map data:', error);
      return [];
    }
  }

  /**
   * Get live slot stream data
   */
  async getSlotStream(limit: number = 50): Promise<Array<{
    id: string;
    prefectureName: string;
    procedure: string;
    slotDate: string;
    slotTime: string;
    detectedAt: Date;
    status: 'AVAILABLE' | 'BOOKED' | 'EXPIRED';
  }>> {
    try {
      const detections = await prisma.detection.findMany({
        include: { prefecture: true },
        orderBy: { detectedAt: 'desc' },
        take: limit,
      });

      return detections.map(d => ({
        id: d.id,
        prefectureName: d.prefecture?.name || 'Unknown',
        procedure: 'TITRE_SEJOUR', // TODO: Get from detection
        slotDate: d.slotDate || 'N/A',
        slotTime: d.slotTime || 'N/A',
        detectedAt: d.detectedAt,
        status: this.getSlotStatus(d.detectedAt),
      }));
    } catch (error) {
      logger.error('Error getting slot stream:', error);
      return [];
    }
  }

  /**
   * Get statistics for dashboard
   */
  async getStats(): Promise<{
    totalPrefectures: number;
    activePrefectures: number;
    totalVfsCenters: number;
    slotsFound24h: number;
    slotsFound7d: number;
    topPrefectures: Array<{ name: string; count: number }>;
  }> {
    try {
      const [totalPrefectures, activePrefectures, totalVfsCenters, slots24h, slots7d] = await Promise.all([
        prisma.prefecture.count(),
        prisma.prefecture.count({ where: { status: 'ACTIVE' } }),
        prisma.vfsCenter.count(),
        prisma.detection.count({
          where: { detectedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        }),
        prisma.detection.count({
          where: { detectedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        }),
      ]);

      const topPrefectures = await prisma.detection.groupBy({
        by: ['prefectureId'],
        where: {
          detectedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      });

      const prefectureNames = await prisma.prefecture.findMany({
        where: { id: { in: topPrefectures.map(t => t.prefectureId).filter((id): id is string => id !== null) } },
        select: { id: true, name: true },
      });

      const nameMap = new Map(prefectureNames.map(p => [p.id, p.name]));

      return {
        totalPrefectures,
        activePrefectures,
        totalVfsCenters,
        slotsFound24h: slots24h,
        slotsFound7d: slots7d,
        topPrefectures: topPrefectures.map(t => ({
          name: nameMap.get(t.prefectureId!) || 'Unknown',
          count: t._count.id,
        })),
      };
    } catch (error) {
      logger.error('Error getting stats:', error);
      return {
        totalPrefectures: 0,
        activePrefectures: 0,
        totalVfsCenters: 0,
        slotsFound24h: 0,
        slotsFound7d: 0,
        topPrefectures: [],
      };
    }
  }

  // Helper methods
  private analyzePatterns(history: any[]): any {
    // Simple pattern analysis
    return { hasPattern: history.length > 10 };
  }

  private calculateAverageInterval(history: any[]): number {
    if (history.length < 2) return 24 * 60 * 60 * 1000; // Default 24h
    
    let totalInterval = 0;
    for (let i = 1; i < history.length; i++) {
      totalInterval += history[i].detectedAt.getTime() - history[i-1].detectedAt.getTime();
    }
    return totalInterval / (history.length - 1);
  }

  private getTimeOfDayPattern(history: any[]): { morning: boolean; afternoon: boolean } {
    const morningSlots = history.filter(h => {
      const hour = h.detectedAt.getHours();
      return hour >= 8 && hour < 12;
    }).length;
    
    const afternoonSlots = history.filter(h => {
      const hour = h.detectedAt.getHours();
      return hour >= 14 && hour < 18;
    }).length;

    return {
      morning: morningSlots > afternoonSlots,
      afternoon: afternoonSlots >= morningSlots,
    };
  }

  private generateReason(patterns: any, timeOfDay: any): string {
    if (patterns.hasPattern) {
      return timeOfDay.morning 
        ? 'Historically slots appear in the morning'
        : 'Historically slots appear in the afternoon';
    }
    return 'Based on average interval between slots';
  }

  private getSlotStatus(detectedAt: Date): 'AVAILABLE' | 'BOOKED' | 'EXPIRED' {
    const age = Date.now() - detectedAt.getTime();
    if (age < 5 * 60 * 1000) return 'AVAILABLE'; // < 5 min
    if (age < 30 * 60 * 1000) return 'BOOKED';   // < 30 min
    return 'EXPIRED';
  }

  private getCoordinates(department: string): { lat: number; lng: number } | undefined {
    // Simplified coordinates for major departments
    const coords: Record<string, { lat: number; lng: number }> = {
      '75': { lat: 48.8566, lng: 2.3522 }, // Paris
      '69': { lat: 45.7640, lng: 4.8357 }, // Lyon
      '13': { lat: 43.2965, lng: 5.3698 }, // Marseille
      '31': { lat: 43.6047, lng: 1.4442 }, // Toulouse
      '59': { lat: 50.6292, lng: 3.0573 }, // Lille
      '33': { lat: 44.8378, lng: -0.5792 }, // Bordeaux
      '06': { lat: 43.7102, lng: 7.2620 }, // Nice
      '44': { lat: 47.2184, lng: -1.5536 }, // Nantes
      '67': { lat: 48.5734, lng: 7.7521 }, // Strasbourg
      '34': { lat: 43.6108, lng: 3.8767 }, // Montpellier
    };
    return coords[department];
  }
}

export const analyticsService = new AnalyticsService();
