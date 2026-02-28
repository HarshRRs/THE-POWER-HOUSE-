import { Server as SocketServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
import logger from '../utils/logger.util.js';
import { prisma } from '../config/database.js';
import { pushService } from './notifications/push.service.js';

/**
 * WebSocket Service for Real-Time Boss Panel
 * Sends live slot updates, prefecture status, and analytics
 */
class WebSocketService {
  private io: SocketServer | null = null;
  private activeConnections: number = 0;

  initialize(server: HttpServer): void {
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
      },
    });

    this.io.on('connection', (socket) => {
      this.activeConnections++;
      logger.info(`Boss Panel connected. Active: ${this.activeConnections}`);

      // Send initial data
      this.sendInitialData(socket);

      // Handle subscription to specific prefectures
      socket.on('subscribe_prefecture', (prefectureId: string) => {
        socket.join(`prefecture:${prefectureId}`);
        logger.info(`Subscribed to prefecture: ${prefectureId}`);
      });

      // Handle subscription to procedure type
      socket.on('subscribe_procedure', (procedureType: string) => {
        socket.join(`procedure:${procedureType}`);
        logger.info(`Subscribed to procedure: ${procedureType}`);
      });

      socket.on('disconnect', () => {
        this.activeConnections--;
        logger.info(`Boss Panel disconnected. Active: ${this.activeConnections}`);
      });
    });

    logger.info('WebSocket service initialized');
  }

  /**
   * Send initial data to new connection
   */
  private async sendInitialData(socket: any): Promise<void> {
    try {
      // Get all prefectures with latest status
      const prefectures = await prisma.prefecture.findMany({
        select: {
          id: true,
          name: true,
          department: true,
          region: true,
          tier: true,
          status: true,
          lastSlotFoundAt: true,
          lastScrapedAt: true,
        },
        orderBy: { tier: 'asc' },
      });

      // Get recent detections (last 24 hours)
      const recentDetections = await prisma.detection.findMany({
        where: {
          detectedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        include: {
          prefecture: true,
        },
        orderBy: { detectedAt: 'desc' },
        take: 50,
      });

      socket.emit('initial_data', {
        prefectures,
        recentDetections,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error sending initial data:', error);
    }
  }

  /**
   * Broadcast slot detection to all connected clients
   */
  broadcastSlotDetection(detection: {
    prefectureId: string;
    prefectureName: string;
    slotsAvailable: number;
    slotDate?: string;
    slotTime?: string;
    bookingUrl: string;
    procedure?: string;
  }): void {
    if (!this.io) return;

    const event = {
      ...detection,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to all
    this.io.emit('slot_detected', event);

    // Broadcast to prefecture-specific room
    this.io.to(`prefecture:${detection.prefectureId}`).emit('slot_detected', event);

    // Broadcast to procedure-specific room
    if (detection.procedure) {
      this.io.to(`procedure:${detection.procedure}`).emit('slot_detected', event);
    }

    // Send push notification to all subscribed users
    pushService.sendSlotNotification({
      prefectureName: detection.prefectureName,
      procedure: detection.procedure || 'Titre de Séjour',
      slotDate: detection.slotDate || 'N/A',
      slotTime: detection.slotTime || 'N/A',
      bookingUrl: detection.bookingUrl,
    }).catch((err) => {
      logger.error('Failed to send push notification:', err);
    });

    logger.info(`Slot broadcasted: ${detection.prefectureName} - ${detection.slotsAvailable} slots`);
  }

  /**
   * Broadcast prefecture status update
   */
  broadcastPrefectureStatus(prefectureId: string, status: {
    status: string;
    lastScrapedAt?: Date;
    lastSlotFoundAt?: Date;
    consecutiveErrors?: number;
  }): void {
    if (!this.io) return;

    this.io.emit('prefecture_status_update', {
      prefectureId,
      ...status,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send live ticker update (for slot stream)
   */
  sendTickerUpdate(data: {
    prefectureName: string;
    procedure: string;
    slotDate: string;
    slotTime: string;
    status: 'AVAILABLE' | 'BOOKED' | 'EXPIRED';
  }): void {
    if (!this.io) return;

    this.io.emit('ticker_update', {
      ...data,
      time: new Date().toLocaleTimeString('fr-FR'),
    });
  }

  /**
   * Get active connections count
   */
  getActiveConnections(): number {
    return this.activeConnections;
  }

  /**
   * Broadcast to boss panel (generic event)
   */
  broadcast(event: string, data: Record<string, unknown>): void {
    if (!this.io) return;
    
    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}

export const websocketService = new WebSocketService();

/**
 * Helper function to broadcast to boss panel
 */
export function broadcastToBossPanel(data: Record<string, unknown>): void {
  const eventType = (data.type as string) || 'notification';
  websocketService.broadcast(eventType, data);
}
