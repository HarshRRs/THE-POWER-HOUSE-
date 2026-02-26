import type { SlotDetectionData, NotificationMetadata } from '../../types/notification.types.js';

// Helper to get the location name for templates
function getLocationName(data: SlotDetectionData): string {
  if (data.consulateName) {
    return data.categoryName
      ? `${data.consulateName} (${data.categoryName})`
      : data.consulateName;
  }
  return data.department
    ? `${data.prefectureName} (${data.department})`
    : (data.prefectureName || 'Unknown');
}

function getLocationLabel(data: SlotDetectionData): string {
  return data.consulateName ? data.consulateName : (data.prefectureName || 'Unknown');
}

export const TEMPLATES = {
  slot_detected: {
    email: {
      subject: (data: SlotDetectionData) => 
        data.consulateName
          ? `🚨 APPOINTMENT DETECTED - ${getLocationName(data)}`
          : `🚨 CRÉNEAU DÉTECTÉ - ${getLocationName(data)}`,
      
      html: (data: SlotDetectionData) => data.consulateName
        ? `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white;">
    <div style="background: linear-gradient(135deg, #FF9933 0%, #138808 100%); color: white; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px;">🚨 APPOINTMENT DETECTED!</h1>
    </div>
    <div style="padding: 30px;">
      <h2 style="color: #333; margin-top: 0;">${getLocationName(data)}</h2>
      <div style="background: #f0f9f0; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-size: 18px; font-weight: bold; color: #22c55e;">
          ${data.slotsAvailable} slot(s) available
        </p>
        ${data.slotDate ? `<p style="margin: 10px 0 0 0; color: #666;">📅 Date: ${data.slotDate} ${data.slotTime || ''}</p>` : ''}
      </div>
      <a href="${data.bookingUrl}" style="display: inline-block; background: #FF9933; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin-top: 20px;">
        BOOK NOW →
      </a>
      <p style="color: #888; margin-top: 30px; font-size: 14px;">
        ⚡ Slots disappear in minutes. Book immediately.
      </p>
    </div>
    <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #888;">
      <p style="margin: 0;">RDVPriority.fr - Your appointment assistant</p>
    </div>
  </div>
</body>
</html>`
        : `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white;">
    <div style="background: linear-gradient(135deg, #e1000f 0%, #c20000 100%); color: white; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px;">🚨 CRÉNEAU DÉTECTÉ !</h1>
    </div>
    <div style="padding: 30px;">
      <h2 style="color: #333; margin-top: 0;">${getLocationName(data)}</h2>
      <div style="background: #f0f9f0; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-size: 18px; font-weight: bold; color: #22c55e;">
          ${data.slotsAvailable} créneau(x) disponible(s)
        </p>
        ${data.slotDate ? `<p style="margin: 10px 0 0 0; color: #666;">📅 Date: ${data.slotDate} ${data.slotTime || ''}</p>` : ''}
      </div>
      <a href="${data.bookingUrl}" style="display: inline-block; background: #e1000f; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin-top: 20px;">
        RÉSERVER MAINTENANT →
      </a>
      <p style="color: #888; margin-top: 30px; font-size: 14px;">
        ⚡ Les créneaux partent en quelques minutes. Réservez immédiatement.
      </p>
    </div>
    <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #888;">
      <p style="margin: 0;">RDVPriority.fr - Votre assistant rendez-vous préfecture</p>
    </div>
  </div>
</body>
</html>`,
    },
    
    sms: (data: SlotDetectionData) => 
      data.consulateName
        ? `🚨 RDVPriority: ${data.slotsAvailable} slot(s) at ${getLocationName(data)}! Book now: ${data.bookingUrl}`
        : `🚨 RDVPriority: ${data.slotsAvailable} créneau(x) à ${getLocationLabel(data)}! Réservez vite: ${data.bookingUrl}`,
    
    whatsapp: (data: SlotDetectionData) => 
      data.consulateName
        ? `🚨 *APPOINTMENT DETECTED!*\n\n` +
          `🏛️ *${getLocationName(data)}*\n` +
          `📅 ${data.slotsAvailable} slot(s) available\n` +
          `${data.slotDate ? `📆 Date: ${data.slotDate} ${data.slotTime || ''}\n` : ''}` +
          `\n👉 Book now:\n${data.bookingUrl}\n\n` +
          `⚡ _Slots disappear in minutes. Act now!_`
        : `🚨 *CRÉNEAU DÉTECTÉ!*\n\n` +
          `🏛️ *${getLocationLabel(data)}* (${data.department})\n` +
          `📅 ${data.slotsAvailable} créneau(x) disponible(s)\n` +
          `${data.slotDate ? `📆 Date: ${data.slotDate} ${data.slotTime || ''}\n` : ''}` +
          `\n👉 Réservez maintenant:\n${data.bookingUrl}\n\n` +
          `⚡ _Les créneaux partent en minutes. Agissez maintenant!_`,
    
    telegram: (data: SlotDetectionData) => 
      data.consulateName
        ? `🚨 <b>APPOINTMENT DETECTED!</b>\n\n` +
          `🏛️ ${getLocationName(data)}\n` +
          `📅 ${data.slotsAvailable} slot(s) available\n` +
          `${data.slotDate ? `📆 Date: ${data.slotDate} ${data.slotTime || ''}\n` : ''}` +
          `\n👉 <a href="${data.bookingUrl}">BOOK NOW</a>\n\n` +
          `⚡ Slots disappear in minutes. Act now!`
        : `🚨 <b>CRÉNEAU DÉTECTÉ!</b>\n\n` +
          `🏛️ ${getLocationLabel(data)} (${data.department})\n` +
          `📅 ${data.slotsAvailable} créneau(x) disponible(s)\n` +
          `${data.slotDate ? `📆 Date: ${data.slotDate} ${data.slotTime || ''}\n` : ''}` +
          `\n👉 <a href="${data.bookingUrl}">RÉSERVER MAINTENANT</a>\n\n` +
          `⚡ Les créneaux partent en minutes. Agissez maintenant!`,
    
    push: {
      title: (data: SlotDetectionData) => 
        data.consulateName
          ? `🚨 Appointment - ${getLocationLabel(data)}`
          : `🚨 Créneau détecté - ${getLocationLabel(data)}`,
      body: (data: SlotDetectionData) => 
        data.consulateName
          ? `${data.slotsAvailable} slot(s) available${data.categoryName ? ` for ${data.categoryName}` : ''}${data.slotDate ? ` on ${data.slotDate}` : ''}. Book now!`
          : `${data.slotsAvailable} créneau(x) disponible(s)${data.slotDate ? ` pour le ${data.slotDate}` : ''}. Réservez maintenant!`,
    },
  },

  plan_expiring: {
    email: {
      subject: (_data: NotificationMetadata) => 
        `Votre abonnement RDVPriority expire bientot`,
      
      html: (data: NotificationMetadata) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 30px;">
    <h2>⚠️ Votre abonnement expire dans ${data.daysRemaining} jour(s)</h2>
    <p>Renouvelez maintenant pour continuer à recevoir les alertes de créneaux disponibles.</p>
    <a href="${process.env.FRONTEND_URL}/pricing" style="display: inline-block; background: #e1000f; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px;">
      Renouveler mon abonnement
    </a>
  </div>
</body>
</html>`,
    },
    
    sms: (data: NotificationMetadata) => 
      `⚠️ RDVPriority: Votre abonnement expire dans ${data.daysRemaining} jour(s). Renouvelez sur rdvpriority.fr`,
    
    telegram: (data: NotificationMetadata) => 
      `⚠️ <b>Abonnement expirant</b>\n\n` +
      `Votre abonnement ${data.plan} expire dans ${data.daysRemaining} jour(s).\n\n` +
      `Renouvelez pour continuer à recevoir les alertes.`,
    
    push: {
      title: () => `⚠️ Abonnement expirant`,
      body: (data: NotificationMetadata) => 
        `Votre abonnement expire dans ${data.daysRemaining} jour(s). Renouvelez maintenant.`,
    },
  },

  welcome: {
    email: {
      subject: () => `Bienvenue sur RDVPriority! 🎉`,
      
      html: () => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 30px;">
    <h1>🎉 Bienvenue sur RDVPriority!</h1>
    <p>Votre compte a été créé avec succès.</p>
    <p>Pour commencer à recevoir des alertes de créneaux disponibles:</p>
    <ol>
      <li>Choisissez un abonnement</li>
      <li>Créez une alerte pour votre préfecture</li>
      <li>Recevez des notifications en temps réel</li>
    </ol>
    <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; background: #e1000f; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px;">
      Accéder au tableau de bord
    </a>
  </div>
</body>
</html>`,
    },
    
    telegram: () => 
      `🎉 <b>Bienvenue sur RDVPriority!</b>\n\n` +
      `Votre compte Telegram est maintenant connecté.\n` +
      `Vous recevrez les alertes de créneaux ici.`,
  },

  plan_activated: {
    email: {
      subject: (data: NotificationMetadata) => 
        `✅ Votre abonnement ${data.plan} est activé!`,
      
      html: (data: NotificationMetadata) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 30px;">
    <h1>✅ Abonnement activé!</h1>
    <p>Votre abonnement <strong>${data.plan}</strong> est maintenant actif.</p>
    <p>Créez vos alertes pour commencer à être notifié des créneaux disponibles.</p>
    <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; background: #22c55e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px;">
      Créer une alerte
    </a>
  </div>
</body>
</html>`,
    },
  },
};

export type TemplateType = keyof typeof TEMPLATES;
