import type { NotificationChannel } from '@prisma/client';

export interface NotificationPayload {
  userId: string;
  channel: NotificationChannel;
  type: 'slot_detected' | 'plan_expiring' | 'welcome' | 'plan_activated';
  title: string;
  body: string;
  metadata: NotificationMetadata;
}

export interface NotificationMetadata {
  prefectureId?: string;
  prefectureName?: string;
  department?: string;
  slotsAvailable?: number;
  bookingUrl?: string;
  slotDate?: string;
  slotTime?: string;
  daysRemaining?: number;
  plan?: string;
}

export interface SlotDetectionData {
  prefectureId: string;
  prefectureName: string;
  department: string;
  slotsAvailable: number;
  bookingUrl: string;
  slotDate?: string;
  slotTime?: string;
  screenshotPath?: string;
}

export interface WebSocketEvents {
  'slot_detected': SlotDetectionData;
  'plan_expiring': { daysRemaining: number; plan: string };
  'alert_updated': { alertId: string; status: string };
  'system_stats': { totalDetections: number; activeUsers: number };
}
