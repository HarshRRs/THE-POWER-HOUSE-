import { Resend } from 'resend';
import logger from '../../utils/logger.util.js';

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const EMAIL_FROM = process.env.EMAIL_FROM || 'RDVPriority <alerte@rdvpriority.fr>';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!resend) {
    logger.warn('Email service not configured (RESEND_API_KEY missing)');
    return false;
  }

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (result.error) {
      logger.error('Failed to send email:', result.error);
      return false;
    }

    logger.info(`Email sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    logger.error('Email sending error:', error);
    return false;
  }
}

export function isEmailConfigured(): boolean {
  return !!resend;
}
