import { Router } from 'express';
import crypto from 'crypto';
import type { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { sendTelegram, extractChatId, type TelegramUpdate } from '../services/notifications/telegram.service.js';
import { sendSuccess, sendError } from '../utils/responses.util.js';
import logger from '../utils/logger.util.js';

const router = Router();

// POST /api/telegram/webhook - Telegram bot webhook
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const update = req.body as TelegramUpdate;
    const chatId = extractChatId(update);
    const text = update.message?.text;

    if (!chatId) {
      sendSuccess(res, { ok: true });
      return;
    }

    // Handle /start command with linking code
    if (text?.startsWith('/start')) {
      const parts = text.split(' ');
      const linkCode = parts[1]; // /start <linkCode>

      if (linkCode) {
        // Find user by link code (stored temporarily in telegramChatId field as "pending:code")
        const user = await prisma.user.findFirst({
          where: { telegramChatId: `pending:${linkCode}` },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { telegramChatId: chatId },
          });

          await sendTelegram({
            chatId,
            message: `✅ <b>Compte lié avec succès!</b>\n\nVotre compte Telegram est maintenant connecté à RDVPriority.\n\nVous recevrez les alertes de créneaux disponibles ici.`,
          });

          logger.info(`Telegram linked for user ${user.id}`);
        } else {
          await sendTelegram({
            chatId,
            message: `❌ Code de liaison invalide ou expiré.\n\nRendez-vous sur rdvpriority.fr pour obtenir un nouveau code.`,
          });
        }
      } else {
        await sendTelegram({
          chatId,
          message: `👋 <b>Bienvenue sur RDVPriority!</b>\n\nPour lier votre compte Telegram:\n1. Connectez-vous sur rdvpriority.fr\n2. Allez dans Paramètres > Notifications\n3. Cliquez sur "Lier Telegram"\n4. Suivez les instructions`,
        });
      }
    }

    sendSuccess(res, { ok: true });
  } catch (error) {
    logger.error('Telegram webhook error:', error);
    sendSuccess(res, { ok: true }); // Always return 200 to Telegram
  }
});

// POST /api/telegram/link - Generate link code for user
router.post('/link', async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId;
    
    if (!userId) {
      sendError(res, 'User ID required', 400);
      return;
    }

    // Generate cryptographically secure 8-char code
    const linkCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    
    // Store pending link code
    await prisma.user.update({
      where: { id: userId },
      data: { telegramChatId: `pending:${linkCode}` },
    });

    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'RDVPriorityBot';
    const linkUrl = `https://t.me/${botUsername}?start=${linkCode}`;

    sendSuccess(res, { linkCode, linkUrl });
  } catch (error) {
    logger.error('Telegram link error:', error);
    sendError(res, 'Failed to generate link', 500);
  }
});

export default router;
