import logger from '../../utils/logger.util.js';

const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_API = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`;

export interface WhatsAppOptions {
  to: string; // Phone number with country code (e.g., "33612345678")
  message: string;
}

interface WhatsAppAPIResponse {
  messaging_product?: string;
  contacts?: Array<{ input: string; wa_id: string }>;
  messages?: Array<{ id: string }>;
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

/**
 * Format phone number for WhatsApp API
 * Accepts: +33612345678, 0033612345678, 33612345678, 0612345678
 * Returns: 33612345678 (without + or leading 00)
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Remove leading + or 00
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }
  
  // If starts with 0, assume French number and add 33
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '33' + cleaned.substring(1);
  }
  
  return cleaned;
}

export async function sendWhatsApp(options: WhatsAppOptions): Promise<boolean> {
  if (!WHATSAPP_PHONE_ID || !WHATSAPP_ACCESS_TOKEN) {
    logger.warn('WhatsApp service not configured (WHATSAPP_PHONE_ID or WHATSAPP_ACCESS_TOKEN missing)');
    return false;
  }

  const formattedNumber = formatPhoneNumber(options.to);

  try {
    const response = await fetch(WHATSAPP_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedNumber,
        type: 'text',
        text: {
          preview_url: true,
          body: options.message,
        },
      }),
    });

    const result = await response.json() as WhatsAppAPIResponse;

    if (result.error) {
      logger.error('WhatsApp API error:', result.error.message);
      return false;
    }

    if (result.messages && result.messages.length > 0) {
      logger.info(`WhatsApp message sent to ${formattedNumber}, message_id: ${result.messages[0].id}`);
      return true;
    }

    logger.error('WhatsApp API unexpected response:', result);
    return false;
  } catch (error) {
    logger.error('WhatsApp sending error:', error);
    return false;
  }
}

export function isWhatsAppConfigured(): boolean {
  return !!(WHATSAPP_PHONE_ID && WHATSAPP_ACCESS_TOKEN);
}

/**
 * Send WhatsApp message using a pre-approved template
 * Required for initiating conversations (24h window rule)
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode: string = 'fr',
  components?: Array<{ type: string; parameters: Array<{ type: string; text: string }> }>
): Promise<boolean> {
  if (!WHATSAPP_PHONE_ID || !WHATSAPP_ACCESS_TOKEN) {
    logger.warn('WhatsApp service not configured');
    return false;
  }

  const formattedNumber = formatPhoneNumber(to);

  try {
    const response = await fetch(WHATSAPP_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedNumber,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components: components || [],
        },
      }),
    });

    const result = await response.json() as WhatsAppAPIResponse;

    if (result.error) {
      logger.error('WhatsApp template API error:', result.error.message);
      return false;
    }

    return !!(result.messages && result.messages.length > 0);
  } catch (error) {
    logger.error('WhatsApp template sending error:', error);
    return false;
  }
}
