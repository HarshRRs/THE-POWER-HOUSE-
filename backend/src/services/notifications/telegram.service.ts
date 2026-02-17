import logger from '../../utils/logger.util.js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export interface TelegramOptions {
  chatId: string;
  message: string;
  parseMode?: 'HTML' | 'Markdown';
}

export async function sendTelegram(options: TelegramOptions): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    logger.warn('Telegram service not configured (TELEGRAM_BOT_TOKEN missing)');
    return false;
  }

  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: options.chatId,
        text: options.message,
        parse_mode: options.parseMode || 'HTML',
        disable_web_page_preview: false,
      }),
    });

    const result = await response.json() as { ok: boolean; description?: string };

    if (!result.ok) {
      logger.error('Telegram API error:', result.description);
      return false;
    }

    logger.info(`Telegram message sent to ${options.chatId}`);
    return true;
  } catch (error) {
    logger.error('Telegram sending error:', error);
    return false;
  }
}

export function isTelegramConfigured(): boolean {
  return !!TELEGRAM_BOT_TOKEN;
}

// Webhook handler for receiving messages (to get chat IDs)
export interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
    from?: { id: number; username?: string };
  };
}

export function extractChatId(update: TelegramUpdate): string | null {
  return update.message?.chat?.id?.toString() || null;
}
