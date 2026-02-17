# RDVPriority.fr — Scalable Backend Architecture Specification

## WHAT THIS DOCUMENT IS

This is a **complete technical specification** for building a production-grade, scalable backend that scrapes ALL 101 French prefectures for available appointment slots and sends real-time alerts to paying users. Give this document to an AI or developer and they should be able to build the entire backend from scratch.

---

## TABLE OF CONTENTS

1. [System Overview](#1-system-overview)
2. [Tech Stack](#2-tech-stack)
3. [Database Schema (PostgreSQL + Prisma)](#3-database-schema)
4. [API Server (Express.js)](#4-api-server)
5. [Scraper Engine (Playwright Workers)](#5-scraper-engine)
6. [Queue System (BullMQ + Redis)](#6-queue-system)
7. [Notification Service](#7-notification-service)
8. [Payment System (Stripe)](#8-payment-system)
9. [Infrastructure & Deployment](#9-infrastructure--deployment)
10. [Prefecture Configurations](#10-prefecture-configurations)
11. [File Structure](#11-file-structure)
12. [Environment Variables](#12-environment-variables)
13. [Security Considerations](#13-security-considerations)

---

## 1. SYSTEM OVERVIEW

### Architecture Diagram

```
User (Browser/App)
       │
       ▼
┌─────────────────┐
│   API Server     │  ← Express.js (port 4000)
│   (REST + Auth)  │  ← JWT auth, Stripe webhooks
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────────┐
│ PostgreSQL│ │   Redis      │
│ (Primary │ │ (Queue +     │
│  Database)│ │  Cache +     │
│           │ │  Pub/Sub)    │
└────────┘ └─────┬──────┘
                  │
         ┌────────┴────────┐
         ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ Scraper Worker│  │ Scraper Worker│  ← Multiple Playwright instances
│   Pool #1     │  │   Pool #2     │  ← Each handles N prefectures
└──────┬───────┘  └──────┬───────┘
       │                  │
       ▼                  ▼
┌─────────────────────────────┐
│  Notification Service        │
│  (Email / SMS / Telegram)    │
└─────────────────────────────┘
```

### How It Works

1. **User registers** → selects plan → pays via Stripe → account activated
2. **User creates alert** → picks prefecture + procedure → saved to DB
3. **Scraper workers** run on a loop, checking prefecture websites at intervals:
   - Tier 1 (Paris, Île-de-France): every 30s
   - Tier 2 (Major cities): every 60s
   - Tier 3 (Other prefectures): every 120s
4. **When a slot is detected** → check which users have active alerts for that prefecture
5. **Send notifications** to those users via their configured channels (email/SMS/Telegram)
6. **Log everything** → detection history, notification delivery, errors

---

## 2. TECH STACK

| Component | Technology | Why |
|-----------|-----------|-----|
| **API Server** | Node.js + Express.js + TypeScript | Fast, mature, huge ecosystem |
| **Database** | PostgreSQL 16 | ACID, JSON support, rock solid |
| **ORM** | Prisma | Type-safe, migrations, great DX |
| **Cache/Queue** | Redis 7 | BullMQ queues, caching, pub/sub |
| **Job Queue** | BullMQ | Reliable, repeatable jobs, retries |
| **Scraping** | Playwright (Chromium) | Handles JS-rendered pages, stealth |
| **Anti-Detection** | playwright-extra + stealth plugin | Bypasses bot detection |
| **Email** | SendGrid or Resend | Transactional emails at scale |
| **SMS** | Twilio | Reliable, global coverage, French numbers |
| **Telegram** | Telegram Bot API | Free, instant, popular in France |
| **Payments** | Stripe | PCI compliant, EU support, subscriptions |
| **Auth** | JWT + bcrypt | Stateless, scalable |
| **Rate Limiting** | express-rate-limit + Redis store | Protects API |
| **Monitoring** | Sentry + custom health checks | Error tracking |
| **Deploy** | Docker + VPS (Hetzner/OVH) | Cost-effective for scrapers |

---

## 3. DATABASE SCHEMA

### Prisma Schema (schema.prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ═══════════════════════════════════════
// USER & AUTH
// ═══════════════════════════════════════

model User {
  id                String    @id @default(uuid())
  email             String    @unique
  passwordHash      String
  phone             String?   // For SMS alerts
  telegramChatId    String?   // For Telegram alerts
  
  // Plan info
  plan              Plan      @default(NONE)
  planExpiresAt     DateTime?
  stripeCustomerId  String?   @unique
  
  // Notification prefs
  notifyEmail       Boolean   @default(true)
  notifyTelegram    Boolean   @default(false)
  notifySms         Boolean   @default(false)
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  alerts            Alert[]
  payments          Payment[]
  notifications     Notification[]
}

enum Plan {
  NONE          // No active plan
  URGENCE_24H   // 4.99€, 24 hours
  URGENCE_7J    // 14.99€, 7 days
  URGENCE_TOTAL // 29.99€/month
}

// ═══════════════════════════════════════
// ALERTS (what the user is monitoring)
// ═══════════════════════════════════════

model Alert {
  id              String      @id @default(uuid())
  userId          String
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  prefectureId    String      // e.g. "paris_75"
  procedure       Procedure
  isActive        Boolean     @default(true)
  
  // Tracking
  lastCheckedAt   DateTime?
  slotsFound      Int         @default(0)
  notificationsSent Int       @default(0)
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  detections      Detection[]
  
  @@index([prefectureId, isActive])
  @@index([userId])
}

enum Procedure {
  TITRE_SEJOUR        // Titre de séjour
  NATURALISATION       // Naturalisation
  VISA                 // Visa
  CARTE_IDENTITE       // Carte d'identité
  PASSEPORT            // Passeport
  PERMIS_CONDUIRE      // Permis de conduire
  CARTE_GRISE          // Carte grise
  AUTRE                // Autre
}

// ═══════════════════════════════════════
// DETECTIONS (when a slot is found)
// ═══════════════════════════════════════

model Detection {
  id              String    @id @default(uuid())
  alertId         String
  alert           Alert     @relation(fields: [alertId], references: [id], onDelete: Cascade)
  
  prefectureId    String
  slotsAvailable  Int
  slotDate        String?   // "2026-03-15" if detected
  slotTime        String?   // "09:30" if detected
  bookingUrl      String    // Direct URL to book
  screenshotPath  String?   // Path to screenshot proof
  
  detectedAt      DateTime  @default(now())
  
  @@index([prefectureId, detectedAt])
}

// ═══════════════════════════════════════
// PREFECTURE CONFIG
// ═══════════════════════════════════════

model Prefecture {
  id              String    @id              // "paris_75"
  name            String                     // "Paris"
  department      String                     // "75"
  region          String                     // "Île-de-France"
  tier            Int       @default(3)      // 1=critical, 2=high, 3=normal
  
  bookingUrl      String                     // Main booking page URL
  checkInterval   Int       @default(120)    // Seconds between checks
  
  // Selectors for scraping (CSS/XPath)
  selectors       Json                       // { availabilitySelector, dateSelector, ... }
  
  // Status
  status          PrefectureStatus @default(ACTIVE)
  lastScrapedAt   DateTime?
  lastSlotFoundAt DateTime?
  consecutiveErrors Int     @default(0)
  
  @@index([tier, status])
}

enum PrefectureStatus {
  ACTIVE
  PAUSED       // Temporarily paused (maintenance)
  ERROR        // Too many consecutive errors
  CAPTCHA      // Blocked by CAPTCHA
}

// ═══════════════════════════════════════
// PAYMENTS
// ═══════════════════════════════════════

model Payment {
  id                String    @id @default(uuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id])
  
  stripePaymentId   String    @unique
  stripeSessionId   String?
  
  plan              Plan
  amount            Int       // In cents (499, 1499, 2999)
  currency          String    @default("eur")
  status            PaymentStatus @default(PENDING)
  
  createdAt         DateTime  @default(now())
  paidAt            DateTime?
  refundedAt        DateTime?
  
  @@index([userId, createdAt])
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

// ═══════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════

model Notification {
  id          String    @id @default(uuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  
  channel     NotificationChannel
  type        String    // "slot_detected", "plan_expiring", "welcome"
  title       String
  body        String
  metadata    Json?     // { prefectureId, slotsAvailable, bookingUrl }
  
  status      NotificationDeliveryStatus @default(PENDING)
  sentAt      DateTime?
  failedAt    DateTime?
  errorMsg    String?
  
  createdAt   DateTime  @default(now())
  
  @@index([userId, createdAt])
}

enum NotificationChannel {
  EMAIL
  SMS
  TELEGRAM
}

enum NotificationDeliveryStatus {
  PENDING
  SENT
  FAILED
}

// ═══════════════════════════════════════
// SCRAPER LOGS (for debugging)
// ═══════════════════════════════════════

model ScraperLog {
  id              String    @id @default(uuid())
  prefectureId    String
  workerId        String    // Which worker instance
  
  status          String    // "success", "error", "captcha", "timeout"
  slotsFound      Int       @default(0)
  responseTimeMs  Int       // How long the scrape took
  errorMessage    String?
  screenshotPath  String?
  
  createdAt       DateTime  @default(now())
  
  @@index([prefectureId, createdAt])
  @@index([status, createdAt])
}
```

---

## 4. API SERVER

### Routes

```
POST   /api/auth/register        → Create account + select plan
POST   /api/auth/login            → Login → JWT token
GET    /api/auth/me               → Get current user (requires JWT)

GET    /api/alerts                → List user's alerts
POST   /api/alerts                → Create alert (checks plan limits)
DELETE /api/alerts/:id            → Delete alert
PATCH  /api/alerts/:id/toggle     → Enable/disable alert

GET    /api/prefectures           → List all prefectures + status
GET    /api/prefectures/:id       → Prefecture details + recent detections

GET    /api/detections            → User's recent detections
GET    /api/detections/stats      → Public stats (total found, etc.)

GET    /api/billing/plans         → Available plans + prices
POST   /api/billing/checkout      → Create Stripe checkout session
POST   /api/billing/webhook       → Stripe webhook handler
GET    /api/billing/history       → User's payment history
POST   /api/billing/cancel        → Cancel monthly subscription

PATCH  /api/users/profile         → Update profile (email, phone, telegram)
PATCH  /api/users/notifications   → Update notification preferences

GET    /api/health                → Health check
GET    /api/stats                 → Public stats for landing page
```

### Plan Limits (enforce on API)

```typescript
const PLAN_LIMITS = {
  URGENCE_24H: {
    maxAlerts: 1,
    checkInterval: 120,    // seconds
    duration: 24 * 60 * 60 * 1000, // 24 hours in ms
    channels: ['email'],
    price: 499,            // cents
    type: 'one_time',
  },
  URGENCE_7J: {
    maxAlerts: 3,
    checkInterval: 60,
    duration: 7 * 24 * 60 * 60 * 1000, // 7 days
    channels: ['email', 'telegram'],
    price: 1499,
    type: 'one_time',
  },
  URGENCE_TOTAL: {
    maxAlerts: Infinity,
    checkInterval: 30,
    duration: 30 * 24 * 60 * 60 * 1000, // 30 days (renews)
    channels: ['email', 'telegram', 'sms'],
    price: 2999,
    type: 'subscription',
  },
};
```

### Middleware Stack

```typescript
// Apply in order:
// 1. CORS (allow frontend origin)
// 2. Helmet (security headers)
// 3. express-rate-limit (100 req/15min per IP for auth, 1000 for general)
// 4. express.json() (parse body)
// 5. JWT verification middleware (for protected routes)
// 6. Plan verification middleware (checks plan not expired)
```

---

## 5. SCRAPER ENGINE

### How The Scraper Works

Each scraper worker is a **long-running process** that:

1. Picks up jobs from the BullMQ queue
2. Launches a Playwright Chromium browser (headless)
3. Navigates to the prefecture booking page
4. Checks for available appointment slots
5. If slots found → pushes notification job to notification queue
6. Saves results to DB (Detection + ScraperLog)
7. Takes a screenshot as proof
8. Repeats based on the prefecture's `checkInterval`

### Stealth Configuration

```typescript
// CRITICAL: Without stealth, prefecture sites will block you

import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';

chromium.use(stealth());

const browser = await chromium.launch({
  headless: true,
  args: [
    '--disable-blink-features=AutomationControlled',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--window-size=1920,1080',
  ],
});

const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  viewport: { width: 1920, height: 1080 },
  locale: 'fr-FR',
  timezoneId: 'Europe/Paris',
  // Rotate user agents from a pool
});
```

### Worker Pool Architecture

```
┌─────────────────────────────────────────┐
│           SCRAPER MANAGER                │
│                                          │
│  Responsibilities:                       │
│  - Assigns prefectures to workers        │
│  - Monitors worker health                │
│  - Restarts failed workers               │
│  - Scales workers up/down                │
│  - Rotates proxies per worker            │
│                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Worker 1 │ │ Worker 2 │ │ Worker 3 │ │
│  │ Paris    │ │ Lyon     │ │ Marseille│ │
│  │ Bobigny  │ │ Évry     │ │ Lille    │ │
│  │ Créteil  │ │ Toulouse │ │ Bordeaux │ │
│  │ Nanterre │ │          │ │ Others...│ │
│  └──────────┘ └──────────┘ └──────────┘ │
└─────────────────────────────────────────┘
```

### Scraper Logic Per Prefecture (Pseudo-Code)

```typescript
async function scrapePrefecture(config: PrefectureConfig): Promise<ScrapeResult> {
  const page = await context.newPage();
  
  try {
    // 1. Navigate to booking page
    await page.goto(config.bookingUrl, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // 2. Handle cookie consent popup if present
    const cookieBtn = page.locator(config.selectors.cookieAccept);
    if (await cookieBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cookieBtn.click();
      await page.waitForTimeout(1000);
    }
    
    // 3. Select procedure type if needed
    if (config.selectors.procedureDropdown) {
      await page.selectOption(config.selectors.procedureDropdown, config.procedureValue);
      await page.waitForTimeout(2000);
    }
    
    // 4. Check for available slots
    const slotElements = await page.$$(config.selectors.availableSlot);
    const slotsAvailable = slotElements.length;
    
    // 5. If slots found, extract details
    if (slotsAvailable > 0) {
      const slotDate = await page.textContent(config.selectors.slotDate).catch(() => null);
      const slotTime = await page.textContent(config.selectors.slotTime).catch(() => null);
      
      // Take screenshot as proof
      const screenshotPath = `./screenshots/${config.id}_${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      
      return {
        status: 'slots_found',
        slotsAvailable,
        slotDate,
        slotTime,
        bookingUrl: page.url(),
        screenshotPath,
      };
    }
    
    // 6. No slots
    return { status: 'no_slots', slotsAvailable: 0 };
    
  } catch (error) {
    // Check if it's a CAPTCHA
    const isCaptcha = await page.$('iframe[src*="captcha"]').catch(() => null);
    
    return {
      status: isCaptcha ? 'captcha' : 'error',
      error: error.message,
      screenshotPath: await page.screenshot({ path: `./screenshots/error_${config.id}_${Date.now()}.png` }).catch(() => null),
    };
  } finally {
    await page.close();
  }
}
```

### Anti-Detection Strategies

```typescript
// 1. PROXY ROTATION — Use residential French proxies
const PROXY_POOL = [
  { server: 'http://proxy1.fr:8080', username: 'user', password: 'pass' },
  { server: 'http://proxy2.fr:8080', username: 'user', password: 'pass' },
  // ... 10-20 French residential proxies
  // Providers: Bright Data, Oxylabs, SmartProxy
  // Cost: ~$15-50/month for residential French IPs
];

// Rotate proxy per request
function getNextProxy(): ProxyConfig {
  return PROXY_POOL[Math.floor(Math.random() * PROXY_POOL.length)];
}

// 2. RANDOM DELAYS — Human-like behavior
async function humanDelay(min = 1000, max = 3000) {
  await page.waitForTimeout(Math.random() * (max - min) + min);
}

// 3. USER-AGENT ROTATION
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120...',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120...',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  // ... 20+ real user agents
];

// 4. FINGERPRINT RANDOMIZATION
// Use playwright-extra stealth plugin which handles:
// - navigator.webdriver = false
// - Consistent WebGL fingerprint
// - Realistic screen dimensions
// - Fake plugins array
// - Chrome runtime flags

// 5. SMART RETRY with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000 + Math.random() * 1000));
    }
  }
}
```

---

## 6. QUEUE SYSTEM (BullMQ + Redis)

### Queues

```typescript
// 3 main queues:

// QUEUE 1: Scraping jobs
const scraperQueue = new Queue('scraper', { connection: redis });
// Job data: { prefectureId, alertIds[], checkInterval }
// Repeatable: every N seconds based on prefecture tier
// Concurrency: 5-10 workers

// QUEUE 2: Notification delivery
const notificationQueue = new Queue('notifications', { connection: redis });
// Job data: { userId, channel, type, title, body, metadata }
// Concurrency: 20 (notifications should be fast)
// Retry: 3 attempts with exponential backoff

// QUEUE 3: Maintenance / Housekeeping
const maintenanceQueue = new Queue('maintenance', { connection: redis });
// Jobs: expire plans, clean old logs, update stats, health checks
// Runs: every 1 minute
```

### Job Scheduling

```typescript
// For each active prefecture, create a repeatable job
async function scheduleScrapingJobs() {
  const prefectures = await prisma.prefecture.findMany({
    where: { status: 'ACTIVE' },
  });
  
  for (const pref of prefectures) {
    // Only schedule if there are active alerts for this prefecture
    const activeAlerts = await prisma.alert.count({
      where: { 
        prefectureId: pref.id, 
        isActive: true,
        user: { planExpiresAt: { gt: new Date() } }
      },
    });
    
    if (activeAlerts > 0) {
      await scraperQueue.add(
        `scrape:${pref.id}`,
        { prefectureId: pref.id },
        {
          repeat: { every: pref.checkInterval * 1000 },
          jobId: `repeat:${pref.id}`,
          removeOnComplete: 100,  // Keep last 100 results
          removeOnFail: 50,
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        }
      );
    }
  }
}
```

---

## 7. NOTIFICATION SERVICE

### Email (SendGrid or Resend)

```typescript
async function sendEmail(to: string, subject: string, html: string) {
  // Using Resend (simpler, cheaper than SendGrid)
  await resend.emails.send({
    from: 'RDVPriority <alerte@rdvpriority.fr>',
    to,
    subject,
    html,
  });
}

// Template for slot detection:
const SLOT_ALERT_EMAIL = (data) => `
  <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
    <div style="background: #e1000f; color: white; padding: 20px; text-align: center;">
      <h1>🚨 CRÉNEAU DÉTECTÉ !</h1>
    </div>
    <div style="padding: 30px;">
      <h2>${data.prefectureName} (${data.department})</h2>
      <p><strong>${data.slotsAvailable} créneau(x) disponible(s)</strong></p>
      ${data.slotDate ? `<p>Date: ${data.slotDate} ${data.slotTime || ''}</p>` : ''}
      <a href="${data.bookingUrl}" style="display: inline-block; background: #e1000f; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">
        RÉSERVER MAINTENANT →
      </a>
      <p style="color: #666; margin-top: 20px; font-size: 14px;">
        ⚡ Les créneaux partent en quelques minutes. Réservez immédiatement.
      </p>
    </div>
  </div>
`;
```

### SMS (Twilio)

```typescript
async function sendSms(to: string, body: string) {
  await twilio.messages.create({
    body,
    to,     // "+33612345678"
    from: process.env.TWILIO_PHONE_NUMBER, // French number
  });
}

// Template:
const SLOT_ALERT_SMS = (data) => 
  `🚨 RDVPriority: ${data.slotsAvailable} créneau(x) à ${data.prefectureName}! Réservez vite: ${data.bookingUrl}`;
```

### Telegram Bot

```typescript
// 1. Create bot via @BotFather on Telegram
// 2. Get bot token
// 3. User links their account by sending /start to your bot

async function sendTelegram(chatId: string, message: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    }),
  });
}

// Template:
const SLOT_ALERT_TELEGRAM = (data) => 
  `🚨 <b>CRÉNEAU DÉTECTÉ!</b>\n\n` +
  `🏛️ ${data.prefectureName} (${data.department})\n` +
  `📅 ${data.slotsAvailable} créneau(x) disponible(s)\n` +
  `${data.slotDate ? `📆 Date: ${data.slotDate} ${data.slotTime || ''}\n` : ''}` +
  `\n👉 <a href="${data.bookingUrl}">RÉSERVER MAINTENANT</a>\n\n` +
  `⚡ Les créneaux partent en minutes. Agissez maintenant!`;

// Telegram webhook to capture user chat IDs:
// POST /api/telegram/webhook
// When user sends /start, save their chatId to user record
```

### Notification Flow

```typescript
async function processDetection(detection: Detection, alert: Alert, user: User) {
  const data = {
    prefectureName: detection.prefectureName,
    department: detection.department,
    slotsAvailable: detection.slotsAvailable,
    slotDate: detection.slotDate,
    slotTime: detection.slotTime,
    bookingUrl: detection.bookingUrl,
  };
  
  const planConfig = PLAN_LIMITS[user.plan];
  
  // Send to all enabled channels for this plan
  if (user.notifyEmail && planConfig.channels.includes('email')) {
    await notificationQueue.add('email', { userId: user.id, channel: 'EMAIL', ...data });
  }
  
  if (user.notifyTelegram && planConfig.channels.includes('telegram') && user.telegramChatId) {
    await notificationQueue.add('telegram', { userId: user.id, channel: 'TELEGRAM', ...data });
  }
  
  if (user.notifySms && planConfig.channels.includes('sms') && user.phone) {
    await notificationQueue.add('sms', { userId: user.id, channel: 'SMS', ...data });
  }
}
```

---

## 8. PAYMENT SYSTEM (Stripe)

### One-Time Payments (24h + 7 jours)

```typescript
// Create Checkout Session
app.post('/api/billing/checkout', authMiddleware, async (req, res) => {
  const { plan } = req.body; // 'URGENCE_24H' or 'URGENCE_7J' or 'URGENCE_TOTAL'
  const user = req.user;
  
  const planConfig = PLAN_LIMITS[plan];
  
  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    payment_method_types: ['card'],
    mode: plan === 'URGENCE_TOTAL' ? 'subscription' : 'payment',
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: { 
          name: plan.replace('_', ' '),
          description: `RDVPriority - ${plan}`,
        },
        unit_amount: planConfig.price,
        ...(plan === 'URGENCE_TOTAL' ? { recurring: { interval: 'month' } } : {}),
      },
      quantity: 1,
    }],
    success_url: `${FRONTEND_URL}/dashboard?payment=success&plan=${plan}`,
    cancel_url: `${FRONTEND_URL}/register?payment=cancelled`,
    metadata: {
      userId: user.id,
      plan,
    },
  });
  
  res.json({ checkoutUrl: session.url });
});
```

### Stripe Webhook Handler

```typescript
// POST /api/billing/webhook
// Verify signature, then handle events:

app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
  
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const { userId, plan } = session.metadata;
      
      // Activate user's plan
      const planConfig = PLAN_LIMITS[plan];
      await prisma.user.update({
        where: { id: userId },
        data: {
          plan,
          planExpiresAt: new Date(Date.now() + planConfig.duration),
          stripeCustomerId: session.customer,
        },
      });
      
      // Create payment record
      await prisma.payment.create({
        data: {
          userId,
          plan,
          amount: planConfig.price,
          stripePaymentId: session.payment_intent || session.subscription,
          stripeSessionId: session.id,
          status: 'COMPLETED',
          paidAt: new Date(),
        },
      });
      
      // Schedule scraping for user's alerts
      await scheduleUserAlerts(userId);
      break;
    }
    
    case 'invoice.payment_succeeded': {
      // Monthly subscription renewed
      const invoice = event.data.object;
      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: invoice.customer },
      });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        });
      }
      break;
    }
    
    case 'customer.subscription.deleted': {
      // User cancelled monthly plan
      const sub = event.data.object;
      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: sub.customer },
      });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { plan: 'NONE', planExpiresAt: null },
        });
      }
      break;
    }
  }
  
  res.json({ received: true });
});
```

---

## 9. INFRASTRUCTURE & DEPLOYMENT

### Option A: Single VPS (Start Here — €10-20/month)

```
Hetzner CX31 or OVH VPS
  - 4 vCPU, 8GB RAM, 80GB SSD
  - Ubuntu 22.04
  - €10-15/month

Docker Compose:
  - PostgreSQL container
  - Redis container  
  - API server container
  - Scraper worker container (can run multiple)
  - Nginx reverse proxy (with Let's Encrypt SSL)
```

### Option B: Scaled (When you grow — €50-100/month)

```
Load Balancer (Hetzner LB — €6/month)
    │
    ├── API Server 1 (CX21)
    ├── API Server 2 (CX21)
    │
    ├── Scraper Worker 1 (CX31) → Île-de-France prefectures
    ├── Scraper Worker 2 (CX21) → Major cities
    ├── Scraper Worker 3 (CX21) → Other prefectures
    │
    ├── PostgreSQL (Managed — Hetzner or Supabase)
    └── Redis (Managed — Upstash or Redis Cloud free tier)
```

### Docker Compose (Production)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: rdvpriority
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: rdvpriority
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  api:
    build: ./backend
    restart: always
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgresql://rdvpriority:${DB_PASSWORD}@postgres:5432/rdvpriority
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
      RESEND_API_KEY: ${RESEND_API_KEY}
      TWILIO_SID: ${TWILIO_SID}
      TWILIO_AUTH_TOKEN: ${TWILIO_AUTH_TOKEN}
      TWILIO_PHONE: ${TWILIO_PHONE}
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
    depends_on:
      - postgres
      - redis

  scraper:
    build: ./scraper
    restart: always
    deploy:
      replicas: 3  # Run 3 scraper instances
    environment:
      DATABASE_URL: postgresql://rdvpriority:${DB_PASSWORD}@postgres:5432/rdvpriority
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    depends_on:
      - postgres
      - redis
    # Scrapers need more memory for Chromium
    mem_limit: 2g

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    depends_on:
      - api

volumes:
  postgres_data:
  redis_data:
```

---

## 10. PREFECTURE CONFIGURATIONS

### The 101 Prefectures

Each prefecture needs a **custom scraper config** because each booking system is different. The main booking systems used by French prefectures are:

| System | Prefectures Using It | Approach |
|--------|---------------------|----------|
| **ANTS** (ants.gouv.fr) | ~30 | API-based, can use direct HTTP |
| **Doctolib-style** | ~5 | Widget embed, check iframe |
| **Custom booking** | ~50+ | Each unique, needs CSS selectors |
| **Préfecture en ligne** | ~15 | Common platform, shared selectors |

### Configuration Format

```typescript
// Each prefecture gets a config object:
interface PrefectureConfig {
  id: string;              // "paris_75"
  name: string;            // "Paris"
  department: string;      // "75"
  region: string;          // "Île-de-France"
  tier: 1 | 2 | 3;
  
  bookingUrl: string;      // Main URL to check
  bookingSystem: 'ants' | 'custom' | 'doctolib' | 'prefenligne';
  
  // CSS/XPath selectors specific to this prefecture
  selectors: {
    cookieAccept?: string;           // Cookie consent button
    procedureDropdown?: string;       // Procedure type selector
    availableSlot: string;           // Selector for available slots
    noSlotMessage?: string;          // "No slots available" text
    slotDate?: string;               // Date of available slot
    slotTime?: string;               // Time of available slot
    captchaDetect?: string;          // CAPTCHA iframe/div
  };
  
  // Procedures available at this prefecture
  procedures: {
    value: string;                   // Option value in dropdown
    label: string;                   // Human readable
    type: Procedure;                 // Enum value
  }[];
  
  checkInterval: number;             // Seconds between checks
  proxy?: string;                    // Specific proxy for this pref
}
```

### Priority Tier 1 — Île-de-France (30s intervals)

These are the MOST requested and HARDEST to get. Maximum scraping frequency.

```typescript
const TIER_1_PREFECTURES: PrefectureConfig[] = [
  {
    id: "paris_75",
    name: "Paris",
    department: "75",
    region: "Île-de-France",
    tier: 1,
    bookingUrl: "https://www.prefecturedepolice.interieur.gouv.fr/...",
    bookingSystem: 'custom',
    selectors: {
      availableSlot: '.available-slot, .slot-open, [data-available="true"]',
      noSlotMessage: '.no-availability, .aucun-creneau',
      slotDate: '.slot-date',
      cookieAccept: '#cookie-accept, .tarteaucitron-accept',
    },
    procedures: [
      { value: "titre_sejour", label: "Titre de séjour", type: "TITRE_SEJOUR" },
      { value: "naturalisation", label: "Naturalisation", type: "NATURALISATION" },
    ],
    checkInterval: 30,
  },
  {
    id: "bobigny_93",
    name: "Bobigny",
    department: "93",
    region: "Île-de-France",
    tier: 1,
    bookingUrl: "https://www.seine-saint-denis.gouv.fr/...",
    // ... similar config
    checkInterval: 30,
  },
  {
    id: "creteil_94",
    name: "Créteil",
    department: "94",
    // ...
    checkInterval: 30,
  },
  {
    id: "nanterre_92",
    name: "Nanterre",
    department: "92",
    // ...
    checkInterval: 30,
  },
  // + Évry (91), Versailles (78), Pontoise (95), Melun (77)
];
```

### Implementation Strategy

**Phase 1 (Launch):** Scrape **top 10 Île-de-France** prefectures manually. These represent 80% of demand.

**Phase 2 (Growth):** Add next 20 major cities (Lyon, Marseille, etc.)

**Phase 3 (Scale):** Use a unified scraper for all 101 by auto-detecting the booking system.

> **IMPORTANT:** You will need to manually visit each prefecture's booking page, inspect the DOM, and identify the correct CSS selectors. This is the most time-consuming part. Start with Paris (75) and Bobigny (93) — they have the highest demand.

---

## 11. FILE STRUCTURE

```
rdvpriority/
├── backend/
│   ├── src/
│   │   ├── server.ts              # Express app entry
│   │   ├── config/
│   │   │   ├── database.ts        # Prisma client
│   │   │   ├── redis.ts           # Redis connection
│   │   │   ├── stripe.ts          # Stripe instance
│   │   │   └── constants.ts       # Plan limits, etc.
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT verification
│   │   │   ├── rateLimiter.ts     # Rate limiting
│   │   │   ├── planCheck.ts       # Verify active plan
│   │   │   └── errorHandler.ts    # Global error handler
│   │   ├── routes/
│   │   │   ├── auth.ts            # Register, login, me
│   │   │   ├── alerts.ts          # CRUD alerts
│   │   │   ├── billing.ts         # Stripe checkout + webhook
│   │   │   ├── prefectures.ts     # Prefecture list
│   │   │   ├── detections.ts      # Detection history
│   │   │   ├── users.ts           # Profile, notifications
│   │   │   └── health.ts          # Health + stats
│   │   ├── services/
│   │   │   ├── notifications/
│   │   │   │   ├── email.ts       # SendGrid/Resend
│   │   │   │   ├── sms.ts         # Twilio
│   │   │   │   ├── telegram.ts    # Telegram Bot API
│   │   │   │   └── index.ts       # Notification dispatcher
│   │   │   ├── stripe.ts          # Payment logic
│   │   │   └── planManager.ts     # Plan activation/expiry
│   │   └── utils/
│   │       ├── jwt.ts             # Token creation/verify
│   │       ├── logger.ts          # Winston logger
│   │       └── validators.ts      # Input validation (Zod)
│   ├── prisma/
│   │   └── schema.prisma
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── scraper/
│   ├── src/
│   │   ├── index.ts               # Worker entry point
│   │   ├── manager.ts             # Scraper manager (assigns jobs)
│   │   ├── worker.ts              # BullMQ worker process
│   │   ├── browser.ts             # Playwright browser pool
│   │   ├── configs/
│   │   │   ├── index.ts           # All prefecture configs
│   │   │   ├── tier1.ts           # IDF prefectures
│   │   │   ├── tier2.ts           # Major cities
│   │   │   └── tier3.ts           # Others
│   │   ├── scrapers/
│   │   │   ├── base.ts            # Base scraper class
│   │   │   ├── ants.ts            # ANTS system scraper
│   │   │   ├── custom.ts          # Generic custom scraper
│   │   │   └── prefenligne.ts     # Préfecture en ligne scraper
│   │   ├── antidetect/
│   │   │   ├── proxies.ts         # Proxy rotation
│   │   │   ├── useragents.ts      # UA rotation
│   │   │   └── fingerprint.ts     # Browser fingerprint
│   │   └── utils/
│   │       ├── screenshot.ts      # Screenshot capture
│   │       └── retry.ts           # Retry with backoff
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                      # Already built (Next.js)
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── nginx.conf
└── README.md
```

---

## 12. ENVIRONMENT VARIABLES

```env
# ═══ DATABASE ═══
DATABASE_URL=postgresql://rdvpriority:password@localhost:5432/rdvpriority

# ═══ REDIS ═══
REDIS_URL=redis://:password@localhost:6379

# ═══ AUTH ═══
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=7d

# ═══ STRIPE ═══
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_24H=price_...        # Stripe Price ID for 24h plan
STRIPE_PRICE_7J=price_...         # Stripe Price ID for 7-day plan
STRIPE_PRICE_TOTAL=price_...      # Stripe Price ID for monthly plan

# ═══ EMAIL (Resend) ═══
RESEND_API_KEY=re_...
EMAIL_FROM=alerte@rdvpriority.fr

# ═══ SMS (Twilio) ═══
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+33...        # French phone number

# ═══ TELEGRAM ═══
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_WEBHOOK_URL=https://api.rdvpriority.fr/api/telegram/webhook

# ═══ PROXIES ═══
PROXY_LIST=http://user:pass@proxy1:8080,http://user:pass@proxy2:8080

# ═══ APP ═══
FRONTEND_URL=https://rdvpriority.fr
API_URL=https://api.rdvpriority.fr
NODE_ENV=production
PORT=4000

# ═══ MONITORING ═══
SENTRY_DSN=https://...@sentry.io/...
```

---

## 13. SECURITY CONSIDERATIONS

### Must-Have Security

1. **Rate limiting** — 100 requests/15min for auth routes, 1000 for general
2. **bcrypt** passwords — salt rounds = 12
3. **JWT** — Short expiry (7d), include only userId in payload
4. **Stripe webhook verification** — Always verify `stripe-signature` header
5. **Input validation** — Use Zod schemas for ALL inputs
6. **SQL injection** — Prisma handles this, never use raw queries
7. **CORS** — Only allow your frontend domain
8. **Helmet** — Security headers
9. **HTTPS only** — Enforce via nginx
10. **Environment variables** — Never commit secrets

### Scraper Security

1. **Proxy rotation** — Never hit same prefecture from same IP twice in a row
2. **Human-like delays** — Random 1-3s between actions
3. **User-agent rotation** — Pool of 20+ real UAs
4. **Stealth mode** — playwright-extra stealth plugin
5. **Screenshot proof** — Always save screenshots of detections
6. **Error thresholds** — Auto-pause prefecture after 5 consecutive errors
7. **Rate respect** — Don't overwhelm any single server

---

## COST ESTIMATES

| Item | Cost/Month | Notes |
|------|-----------|-------|
| VPS (Hetzner CX31) | €10-15 | 4 vCPU, 8GB RAM |
| Residential Proxies | €15-50 | 10-20 French IPs |
| Resend (email) | €0-20 | Free tier: 3000/month |
| Twilio (SMS) | €5-30 | ~€0.07/SMS to France |
| Domain + SSL | €10/year | rdvpriority.fr |
| **Total** | **€30-115/mo** | |

### Revenue Potential

| Scenario | Users | Revenue/Mo |
|----------|-------|-----------|
| Conservative | 50 users × €14.99 avg | €750/mo |
| Moderate | 200 users × €14.99 avg | €3,000/mo |
| Growth | 500 users × €14.99 avg | €7,500/mo |
| Scale | 2000 users × €14.99 avg | €30,000/mo |

---

## HOW TO USE THIS DOCUMENT

Give this entire file to another AI (Claude, GPT, etc.) with the prompt:

> "Build the complete backend described in this specification. Start with the database schema (Prisma), then the API server (Express + TypeScript), then the scraper engine (Playwright + BullMQ), then the notification service. Use Docker Compose for deployment. Follow the exact file structure described."

Build in this order:
1. **Database** → `prisma/schema.prisma` + migrate
2. **API Server** → Routes, middleware, auth
3. **Stripe Integration** → Checkout + webhooks
4. **Notification Service** → Email, SMS, Telegram
5. **Scraper Engine** → Playwright workers + BullMQ
6. **Prefecture Configs** → Start with Paris (75) + Bobigny (93)
7. **Docker** → Containerize everything
8. **Deploy** → VPS + domain + SSL
