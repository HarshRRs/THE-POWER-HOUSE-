import Twilio from 'twilio';
import logger from '../../utils/logger.util.js';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken 
  ? Twilio(accountSid, authToken)
  : null;

export interface SmsOptions {
  to: string;
  body: string;
}

export async function sendSms(options: SmsOptions): Promise<boolean> {
  if (!client || !fromNumber) {
    logger.warn('SMS service not configured (Twilio credentials missing)');
    return false;
  }

  // Ensure phone number is in E.164 format
  let toNumber = options.to;
  if (!toNumber.startsWith('+')) {
    // Assume French number if no country code
    toNumber = toNumber.startsWith('0') 
      ? `+33${toNumber.slice(1)}`
      : `+33${toNumber}`;
  }

  try {
    const message = await client.messages.create({
      body: options.body,
      to: toNumber,
      from: fromNumber,
    });

    logger.info(`SMS sent to ${toNumber}: ${message.sid}`);
    return true;
  } catch (error) {
    logger.error('SMS sending error:', error);
    return false;
  }
}

export function isSmsConfigured(): boolean {
  return !!(client && fromNumber);
}
