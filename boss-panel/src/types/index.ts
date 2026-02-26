// Shared TypeScript interfaces for boss-panel

export interface Detection {
  id: string;
  alertId?: string;
  prefectureId?: string;
  prefectureName?: string;
  consulateId?: string;
  consulateName?: string;
  vfsCenterId?: string;
  vfsCenterName?: string;
  categoryName?: string;
  slotsAvailable: number;
  slotDate?: string;
  slotTime?: string;
  bookingUrl?: string;
  screenshotPath?: string;
  procedure?: string;
  status?: string;
  detectedAt: string;
  timestamp?: string;
}

export interface Prefecture {
  id: string;
  name: string;
  department: string;
  region: string;
  tier: number;
  bookingUrl: string;
  lastScrapedAt: string | null;
  lastSlotFoundAt: string | null;
  status?: 'hot' | 'warm' | 'cold';
  latestSlot?: {
    slotDate: string;
    slotTime: string;
    slotsAvailable: number;
    detectedAt: string;
  } | null;
  slotsFound24h?: number;
  coordinates?: { lat: number; lng: number };
}

export interface Consulate {
  id: string;
  name: string;
  country: string;
  city: string;
  type: string;
  baseUrl: string;
  status: string;
  lastScrapedAt: string | null;
  _count: {
    alerts: number;
    detections: number;
  };
}

export interface VfsCenter {
  id: string;
  configId: string;
  name: string;
  destinationCountry: string;
  sourceCountry: string;
  city: string;
  centerCode: string;
  bookingUrl: string;
  checkInterval: number;
  status: 'ACTIVE' | 'PAUSED' | 'ERROR' | 'CAPTCHA_BLOCKED';
  lastScrapedAt: string | null;
  lastSlotFoundAt: string | null;
  consecutiveErrors: number;
  _count?: {
    alerts: number;
    detections: number;
  };
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  system: 'PREFECTURE' | 'VFS' | 'EMBASSY';
  prefectureId?: string;
  prefecture?: { name: string };
  vfsCenterId?: string;
  vfsCenter?: { name: string };
  consulateId?: string;
  consulate?: { name: string };
  procedure: string;
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED';
  bookingStatus: string;
  autoBook: boolean;
  priceAgreed: number;
  amountPaid: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingStats {
  total: number;
  active: number;
  booked: number;
  revenue: number;
}

export interface Alert {
  id: string;
  userId: string;
  user?: { email: string };
  prefectureId?: string;
  prefecture?: { name: string };
  vfsCenterId?: string;
  vfsCenter?: { name: string };
  consulateId?: string;
  consulate?: { name: string };
  procedure: string;
  isActive: boolean;
  slotsFound: number;
  lastCheckedAt: string | null;
  createdAt: string;
}

export interface Stats {
  totalPrefectures: number;
  activePrefectures: number;
  totalConsulates: number;
  totalVfsCenters: number;
  slotsFound24h: number;
  slotsFound7d: number;
  successRate: number;
}

export interface WebSocketData {
  prefectures: Prefecture[];
  recentDetections: (Detection | SlotDetection)[];
  timestamp: string;
}

export interface SlotDetection {
  id?: string;
  prefectureId?: string;
  prefectureName?: string;
  consulateId?: string;
  consulateName?: string;
  vfsCenterId?: string;
  vfsCenterName?: string;
  categoryName?: string;
  slotsAvailable: number;
  slotDate?: string;
  slotTime?: string;
  bookingUrl: string;
  procedure?: string;
  detectedAt?: string;
  timestamp: string;
}
