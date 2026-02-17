import type { Server as SocketIOServer } from 'socket.io';
import logger from '../../utils/logger.util.js';
import type { WebSocketEvents, SlotDetectionData } from '../../types/notification.types.js';

let io: SocketIOServer | null = null;

export function initializeWebSocket(socketServer: SocketIOServer): void {
  io = socketServer;
  logger.info('WebSocket service initialized');
}

export function emitToUser<K extends keyof WebSocketEvents>(
  userId: string,
  event: K,
  data: WebSocketEvents[K]
): boolean {
  if (!io) {
    logger.warn('WebSocket server not initialized');
    return false;
  }

  try {
    io.to(`user:${userId}`).emit(event, data);
    logger.debug(`WebSocket event '${event}' sent to user ${userId}`);
    return true;
  } catch (error) {
    logger.error('WebSocket emit error:', error);
    return false;
  }
}

export function emitSlotDetection(userId: string, data: SlotDetectionData): boolean {
  return emitToUser(userId, 'slot_detected', data);
}

export function emitPlanExpiring(userId: string, daysRemaining: number, plan: string): boolean {
  return emitToUser(userId, 'plan_expiring', { daysRemaining, plan });
}

export function emitAlertUpdated(userId: string, alertId: string, status: string): boolean {
  return emitToUser(userId, 'alert_updated', { alertId, status });
}

export function broadcastStats(totalDetections: number, activeUsers: number): void {
  if (!io) return;
  
  io.emit('system_stats', { totalDetections, activeUsers });
}

export function isWebSocketInitialized(): boolean {
  return io !== null;
}

export function getConnectedUserCount(): number {
  if (!io) return 0;
  return io.sockets.sockets.size;
}
