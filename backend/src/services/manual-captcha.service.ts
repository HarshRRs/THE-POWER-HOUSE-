/**
 * MANUAL CAPTCHA ALERT SERVICE
 * =============================
 * Sends Telegram alerts when CAPTCHA is detected
 * User can manually solve and resume scraping
 * 
 * For bootstrap mode: saves €10-30/month on auto-solving services
 */

import { sendTelegram } from './notifications/telegram.service.js';
import { prisma } from '../config/database.js';
import { BOOTSTRAP_CONFIG } from '../config/bootstrap.config.js';
import logger from '../utils/logger.util.js';

interface CaptchaAlert {
  prefectureId: string;
  prefectureName: string;
  bookingUrl: string;
  captchaType: string;
  detectedAt: Date;
}

// Track recent alerts to avoid spam
const recentAlerts = new Map<string, Date>();
const ALERT_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes between alerts per prefecture

/**
 * Send manual CAPTCHA alert to admin via Telegram
 */
export async function sendManualCaptchaAlert(alert: CaptchaAlert): Promise<boolean> {
  // Check if manual mode is enabled
  if (!BOOTSTRAP_CONFIG.manualCaptchaMode) {
    return false;
  }

  const adminChatId = BOOTSTRAP_CONFIG.captchaAlertTelegramId;
  if (!adminChatId) {
    logger.warn('Manual CAPTCHA alert: No admin Telegram ID configured (ADMIN_TELEGRAM_CHAT_ID)');
    return false;
  }

  // Check cooldown
  const lastAlert = recentAlerts.get(alert.prefectureId);
  if (lastAlert && Date.now() - lastAlert.getTime() < ALERT_COOLDOWN_MS) {
    logger.debug(`Skipping CAPTCHA alert for ${alert.prefectureId} (cooldown)`);
    return false;
  }

  const message = 
    `🔒 <b>CAPTCHA DÉTECTÉ!</b>\n\n` +
    `🏛️ <b>${alert.prefectureName}</b>\n` +
    `🔐 Type: ${alert.captchaType}\n` +
    `⏰ Détecté: ${alert.detectedAt.toLocaleString('fr-FR')}\n\n` +
    `👉 <a href="${alert.bookingUrl}">Ouvrir pour résoudre</a>\n\n` +
    `<i>Après résolution, envoyez:</i>\n` +
    `<code>/resume ${alert.prefectureId}</code>`;

  try {
    const success = await sendTelegram({
      chatId: adminChatId,
      message,
      parseMode: 'HTML',
    });

    if (success) {
      recentAlerts.set(alert.prefectureId, new Date());
      logger.info(`Manual CAPTCHA alert sent for ${alert.prefectureId}`);
    }

    return success;
  } catch (error) {
    logger.error('Failed to send manual CAPTCHA alert:', error);
    return false;
  }
}

/**
 * Resume prefecture after manual CAPTCHA solving
 */
export async function resumePrefectureAfterCaptcha(prefectureId: string): Promise<boolean> {
  try {
    await prisma.prefecture.update({
      where: { id: prefectureId },
      data: {
        status: 'ACTIVE',
        consecutiveErrors: 0,
      },
    });

    // Clear from recent alerts
    recentAlerts.delete(prefectureId);

    logger.info(`Prefecture ${prefectureId} resumed after manual CAPTCHA solving`);
    return true;
  } catch (error) {
    logger.error(`Failed to resume prefecture ${prefectureId}:`, error);
    return false;
  }
}

/**
 * Get CAPTCHA status summary
 */
export async function getCaptchaStatusSummary(): Promise<{
  blockedPrefectures: Array<{ id: string; name: string; blockedSince: Date | null }>;
  totalBlocked: number;
}> {
  const blocked = await prisma.prefecture.findMany({
    where: { status: 'CAPTCHA' },
    select: { id: true, name: true, lastScrapedAt: true },
  });

  return {
    blockedPrefectures: blocked.map((p) => ({
      id: p.id,
      name: p.name,
      blockedSince: p.lastScrapedAt,
    })),
    totalBlocked: blocked.length,
  };
}

export default {
  sendManualCaptchaAlert,
  resumePrefectureAfterCaptcha,
  getCaptchaStatusSummary,
};
