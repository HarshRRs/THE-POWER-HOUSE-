# 🇫🇷 RDVPriority.fr — Complete Project Documentation

**Last Updated:** March 2, 2026  
**Status:** Comprehensive documentation compiled from all project modules

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Getting Started](#2-getting-started)
3. [System Architecture](#3-system-architecture)
4. [Backend API Documentation](#4-backend-api-documentation)
5. [Database Schema Design](#5-database-schema-design)
6. [Frontend Application](#6-frontend-application)
7. [Boss Panel Administration](#7-boss-panel-administration)
8. [Booking System](#8-booking-system)
9. [Scraping and Monitoring](#9-scraping-and-monitoring)
10. [Notification System](#10-notification-system)
11. [Worker System](#11-worker-system)
12. [Payment and Subscription Management](#12-payment-and-subscription-management)
13. [Security and Authentication](#13-security-and-authentication)
14. [Performance and Monitoring](#14-performance-and-monitoring)
15. [Deployment and DevOps](#15-deployment-and-devops)
16. [Development Guidelines](#16-development-guidelines)
17. [Troubleshooting and FAQ](#17-troubleshooting-and-faq)
18. [Prefecture Configurations](#18-prefecture-configurations)

---

## 1. PROJECT OVERVIEW

### What is RDVPriority?

RDVPriority is an intelligent appointment booking system that monitors 101 French prefectures for available appointment slots. It provides real-time alerts via Email, Telegram, and SMS to users looking for prefecture appointments.

### Core Problem Solved

French prefecture appointments are extremely hard to get. Users must manually check websites continuously. RDVPriority automates this, checking every 30-120 seconds and alerting users instantly when slots appear.

### Key Metrics

- **Prefectures Monitored:** 101 French prefectures
- **Check Frequency:** 30s (Tier 1) to 120s (Tier 3)
- **Notification Channels:** Email, SMS, Telegram
- **Pricing Plans:** 3-tier subscription model
- **Target Users:** Immigrants and residents needing French documents

### Architecture Overview

```
User (Web/Mobile)
    ↓
Frontend (Next.js 14)
    ↓
API Server (Express.js)
    ↓
┌─────────────────────────────────────┐
│ PostgreSQL (Data) + Redis (Queue)   │
└─────────────────────────────────────┘
    ↓
Scraper Workers (Playwright)
    ↓
Prefecture Websites
    ↓
Notification Service (Email/SMS/Telegram)
```

---

## 2. GETTING STARTED

### Prerequisites

- **Node.js** 18+ 
- **Docker & Docker Compose**
- **PostgreSQL** 16
- **Redis** 7

### Quick Start (5 minutes)

#### 1. Clone and setup

```bash
git clone <repo>
cd rdvpriority
cp .env.example .env
```

#### 2. Start infrastructure

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379

#### 3. Setup backend

```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```

API runs on `http://localhost:4000`

#### 4. Setup frontend

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

#### 5. Start scraper

```bash
cd ../scraper
npm install
npm start
```

### Environment Variables

See `.env.example` for all required variables. Key ones:

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/rdvpriority

# Redis
REDIS_URL=redis://:password@localhost:6379

# Auth
JWT_SECRET=your-secret-key-here

# Payment
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Notifications
RESEND_API_KEY=re_...
TWILIO_ACCOUNT_SID=AC...
TELEGRAM_BOT_TOKEN=123456:ABC...
```

### Database Setup

```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

---

## 3. SYSTEM ARCHITECTURE

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│               Frontend Layer                        │
│  ┌──────────────┐  ┌──────────────┐               │
│  │  Next.js 14  │  │ Boss Panel   │               │
│  │ (Port 3000)  │  │ (Port 3001)  │               │
│  └──────────────┘  └──────────────┘               │
└────────────────────┬────────────────────────────────┘
                     │ REST API (HTTP/HTTPS)
┌────────────────────▼────────────────────────────────┐
│           API Server (Express.js)                   │
│           (Port 4000)                               │
│  ┌──────────────────────────────────────────┐      │
│  │ Routes, Middleware, Authentication       │      │
│  │ - /api/auth (Login/Register)             │      │
│  │ - /api/alerts (CRUD)                     │      │
│  │ - /api/billing (Stripe)                  │      │
│  │ - /api/prefectures (Status)              │      │
│  │ - /api/detections (History)              │      │
│  └──────────────────────────────────────────┘      │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
    ┌────────┐  ┌────────┐  ┌─────────────┐
    │PostgreSQL│  │ Redis  │  │ BullMQ      │
    │(Database)│  │(Cache) │  │(Job Queue)  │
    └────────┘  └────────┘  └─────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
    ┌────────────┐  ┌──────────┐  ┌──────────┐
    │ Scraper    │  │ Scraper  │  │ Scraper  │
    │ Worker 1   │  │ Worker 2 │  │ Worker 3 │
    └────────────┘  └──────────┘  └──────────┘
        (Playwright)  (Playwright)  (Playwright)
        │            │            │
        └────────────┼────────────┘
                     ▼
        French Prefecture Websites
                     │
                     ▼
        Notification Service
        ┌──────────────────────┐
        │ SendGrid (Email)     │
        │ Twilio (SMS)         │
        │ Telegram Bot API     │
        └──────────────────────┘
```

### Component Responsibilities

| Component | Role | Technology |
|-----------|------|-----------|
| **Frontend** | User interface for viewing alerts and managing subscriptions | Next.js 14, React, TailwindCSS |
| **Boss Panel** | Admin dashboard for monitoring system health | Next.js 14, TypeScript |
| **API Server** | Business logic, authentication, payment processing | Express.js, Node.js |
| **PostgreSQL** | Primary data storage (users, alerts, detections) | PostgreSQL 16 |
| **Redis** | Cache, session storage, job queue | Redis 7 |
| **BullMQ** | Job scheduling and processing | BullMQ |
| **Scraper Workers** | Continuous monitoring of prefecture websites | Playwright, Node.js |
| **Notification Service** | Sending alerts via multiple channels | SendGrid, Twilio, Telegram |

### Data Flow

1. **User Signs Up** → Frontend POST `/api/auth/register` → Backend creates user in PostgreSQL
2. **User Creates Alert** → Frontend POST `/api/alerts` → Backend saves alert with prefecture + procedure
3. **Alert Activated** → BullMQ schedules scraping job for that prefecture
4. **Scraper Runs** → Playwright visits prefecture website, checks for slots
5. **Slots Found** → Scraper creates Detection record in PostgreSQL
6. **Notifications Sent** → Notification worker picks up job, sends email/SMS/Telegram
7. **User Receives Alert** → User clicks link, goes to prefecture booking page

---

## 4. BACKEND API DOCUMENTATION

### API Routes

#### Authentication Routes

```
POST   /api/auth/register        Create account (email, password, phone)
POST   /api/auth/login            Login with email/password
GET    /api/auth/me               Get current user info (JWT required)
POST   /api/auth/logout           Logout (clear session)
POST   /api/auth/refresh-token    Refresh expired JWT
```

#### Alerts Management

```
GET    /api/alerts                List all user's active alerts
POST   /api/alerts                Create new alert (checks plan limits)
GET    /api/alerts/:id            Get alert details + recent detections
PATCH  /api/alerts/:id            Update alert settings
DELETE /api/alerts/:id            Delete alert
PATCH  /api/alerts/:id/toggle     Enable/disable alert
```

#### Prefecture Info

```
GET    /api/prefectures           List all 101 prefectures + current status
GET    /api/prefectures/:id       Get specific prefecture details
GET    /api/prefectures/:id/detections  Recent slot detections for prefecture
```

#### Detections & History

```
GET    /api/detections            User's recent detections (last 30 days)
GET    /api/detections/stats      Public statistics (total found, etc.)
```

#### Billing & Payments

```
GET    /api/billing/plans         Available subscription plans
POST   /api/billing/checkout      Create Stripe checkout session
GET    /api/billing/history       User's payment history
POST   /api/billing/cancel        Cancel subscription
POST   /api/billing/webhook       Stripe webhook handler (secret endpoint)
```

#### User Profile

```
PATCH  /api/users/profile         Update email, phone, telegram chat ID
PATCH  /api/users/notifications   Update notification preferences
GET    /api/users/settings        Get all user settings
```

#### System Health

```
GET    /api/health                Server health check
GET    /api/stats                 Public system stats (for landing page)
```

### Authentication

All protected routes require JWT Bearer token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

Token is valid for **7 days**, then needs refresh.

### Error Responses

All errors follow this format:

```json
{
  "error": "error_code",
  "message": "Human readable message",
  "statusCode": 400,
  "timestamp": "2026-03-02T10:30:00Z"
}
```

### Plan Limits

Each subscription plan enforces limits on the API:

```typescript
URGENCE_24H:
  - Max 1 alert per account
  - Check interval: 120s (slower checks)
  - Duration: 24 hours (one-time payment)
  - Channels: Email only
  - Price: €4.99

URGENCE_7J:
  - Max 3 alerts
  - Check interval: 60s
  - Duration: 7 days
  - Channels: Email + Telegram
  - Price: €14.99

URGENCE_TOTAL:
  - Unlimited alerts
  - Check interval: 30s (faster checks)
  - Duration: 30 days (recurring subscription)
  - Channels: Email + Telegram + SMS
  - Price: €29.99/month
```

---

## 5. DATABASE SCHEMA DESIGN

### Core Data Models

#### User Model
```
User
├── id (UUID, primary key)
├── email (unique, indexed)
├── passwordHash (bcrypt)
├── phone (optional, for SMS)
├── telegramChatId (optional, for Telegram)
├── plan (enum: NONE, URGENCE_24H, URGENCE_7J, URGENCE_TOTAL)
├── planExpiresAt (timestamp, nullable)
├── stripeCustomerId (unique, nullable)
├── notifyEmail (boolean)
├── notifyTelegram (boolean)
├── notifySms (boolean)
├── createdAt (timestamp)
├── updatedAt (timestamp)
└── relations:
    ├── alerts (1:many)
    ├── payments (1:many)
    ├── notifications (1:many)
```

#### Alert Model
```
Alert
├── id (UUID, primary key)
├── userId (FK → User)
├── prefectureId (e.g., "paris_75")
├── procedure (enum: TITRE_SEJOUR, PASSEPORT, etc.)
├── isActive (boolean, default: true)
├── lastCheckedAt (timestamp, nullable)
├── slotsFound (integer)
├── notificationsSent (integer)
├── createdAt (timestamp)
├── updatedAt (timestamp)
└── relations:
    └── detections (1:many)
├── indexes:
    ├── [prefectureId, isActive]
    └── [userId]
```

#### Detection Model (Slot Found)
```
Detection
├── id (UUID, primary key)
├── alertId (FK → Alert)
├── prefectureId (indexed)
├── slotsAvailable (integer)
├── slotDate (date, nullable)
├── slotTime (time, nullable)
├── bookingUrl (URL)
├── screenshotPath (S3 path, nullable)
├── detectedAt (timestamp)
└── indexes:
    └── [prefectureId, detectedAt]
```

#### Prefecture Model
```
Prefecture
├── id (primary key, e.g., "paris_75")
├── name (string)
├── department (string, e.g., "75")
├── region (string)
├── tier (int: 1=critical, 2=high, 3=normal)
├── bookingUrl (URL)
├── checkInterval (seconds: 30/60/120)
├── selectors (JSON: CSS selectors for scraping)
├── status (enum: ACTIVE, PAUSED, ERROR, CAPTCHA)
├── lastScrapedAt (timestamp, nullable)
├── lastSlotFoundAt (timestamp, nullable)
├── consecutiveErrors (counter)
└── indexes:
    └── [tier, status]
```

#### Payment Model
```
Payment
├── id (UUID, primary key)
├── userId (FK → User)
├── stripePaymentId (unique)
├── stripeSessionId (nullable)
├── plan (enum)
├── amount (integer, in cents)
├── currency (string, "eur")
├── status (enum: PENDING, COMPLETED, FAILED, REFUNDED)
├── createdAt (timestamp)
├── paidAt (timestamp, nullable)
├── refundedAt (timestamp, nullable)
└── indexes:
    └── [userId, createdAt]
```

#### Notification Model
```
Notification
├── id (UUID, primary key)
├── userId (FK → User)
├── channel (enum: EMAIL, SMS, TELEGRAM)
├── type (string: "slot_detected", "plan_expiring")
├── title (string)
├── body (string)
├── metadata (JSON: prefectureId, slotsAvailable, etc.)
├── status (enum: PENDING, SENT, FAILED)
├── sentAt (timestamp, nullable)
├── failedAt (timestamp, nullable)
├── errorMsg (string, nullable)
├── createdAt (timestamp)
└── indexes:
    └── [userId, createdAt]
```

#### ScraperLog Model
```
ScraperLog
├── id (UUID, primary key)
├── prefectureId (indexed)
├── workerId (which worker instance)
├── status (string: "success", "error", "captcha", "timeout")
├── slotsFound (integer)
├── responseTimeMs (milliseconds)
├── errorMessage (nullable)
├── screenshotPath (nullable)
├── createdAt (timestamp)
└── indexes:
    ├── [prefectureId, createdAt]
    └── [status, createdAt]
```

### Prisma Migrations

Initialize database:

```bash
cd backend
npx prisma migrate dev --name init
```

This creates:
- All tables with correct indexes
- Foreign key constraints
- Enum types

---

## 6. FRONTEND APPLICATION

### Technology Stack

| Tool | Version | Purpose |
|------|---------|---------|
| **Next.js** | 14 | React framework, routing, SSR |
| **React** | 18 | UI components |
| **TypeScript** | 5 | Type safety |
| **TailwindCSS** | 3 | Styling |
| **SWR** | Latest | Data fetching, caching |

### Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Homepage
│   │   ├── register/page.tsx    # Sign up
│   │   ├── login/page.tsx       # Login
│   │   └── dashboard/           # Protected routes
│   │       ├── layout.tsx       # Dashboard layout
│   │       ├── page.tsx         # Dashboard home
│   │       ├── alerts/          # Alerts management
│   │       ├── billing/         # Payment history
│   │       └── settings/        # User settings
│   ├── components/
│   │   ├── Header.tsx           # Navigation
│   │   ├── AlertForm.tsx        # Create alert
│   │   ├── AlertList.tsx        # List alerts
│   │   ├── DetectionCard.tsx    # Display detection
│   │   └── ...other components
│   ├── hooks/
│   │   ├── useAuth.ts           # Auth hook
│   │   └── useAlerts.ts         # Alerts hook
│   ├── lib/
│   │   ├── api.ts               # API client
│   │   └── utils.ts             # Utilities
│   └── types/
│       └── index.ts             # TypeScript types
├── package.json
├── tailwind.config.js
└── next.config.js
```

### Key Pages

#### Homepage (`/`)
- Marketing landing page
- Pricing table
- Call-to-action (Sign Up button)
- Feature highlights
- FAQ section

#### Registration (`/register`)
- Email signup
- Password confirmation
- Terms of service
- Redirect to plan selection on submit

#### Login (`/login`)
- Email + password form
- "Remember me" option
- "Forgot password" link (TODO)
- Redirect to dashboard on success

#### Dashboard (`/dashboard`)
- Quick stats (active alerts, slots found this week)
- Alert list with quick actions
- Recent detections
- Notification history
- Settings quick links

#### Alerts Management (`/dashboard/alerts`)
- Create new alert form
  - Prefecture dropdown (searchable)
  - Procedure type selector
  - Activate button
- Alerts table
  - Prefecture name
  - Procedure type
  - Status (active/paused)
  - Last checked
  - Slots found count
  - Actions (pause, delete)

#### Billing (`/dashboard/billing`)
- Current plan display
- Upgrade/downgrade buttons
- Payment history table
- Stripe checkout integration

#### Settings (`/dashboard/settings`)
- Email address
- Phone number
- Telegram chat ID
- Notification preferences
- Change password

### Authentication Flow

1. User enters email/password on login form
2. Frontend POST to `/api/auth/login`
3. Backend validates credentials, returns JWT
4. Frontend stores JWT in localStorage
5. All subsequent requests include JWT in Authorization header
6. API middleware verifies JWT on protected routes

### State Management

Using **React Context + Hooks** (no Redux needed):

```typescript
// AuthContext - logged-in user state
// AlertsContext - user's alerts
// NotificationsContext - toast messages
```

### Data Fetching

Using **SWR** library:

```typescript
const { data: alerts, isLoading, error } = useSWR(
  '/api/alerts',
  fetcher,
  { revalidateOnFocus: false }
);
```

---

## 7. BOSS PANEL ADMINISTRATION

### Technology Stack

- Next.js 14
- React
- TypeScript
- TailwindCSS
- Real-time updates via API polling

### Purpose

Monitor system health, view statistics, manage prefectures, and debug issues.

### Key Features

#### Dashboard Overview
- Total users (active, paid, free)
- Revenue metrics (MRR, LTV)
- Active alerts count
- Slots detected (today, this week)
- System health (API, Redis, Database)

#### Prefecture Management
- List all 101 prefectures
- Current status (ACTIVE, PAUSED, ERROR, CAPTCHA)
- Last scraped timestamp
- Consecutive error count
- Quick actions (pause, resume, reset)
- Edit selectors / URLs

#### User Management
- Search users by email
- View user details
- Subscription info
- Alerts count
- Recent activity
- Manual plan activation (for testing)

#### Notification Queue Monitor
- Pending notifications count
- Failed notifications log
- Retry failed notifications
- Email/SMS/Telegram delivery rates

#### Scraper Logs
- Real-time scraper activity
- Success/error counts per prefecture
- Average response time
- Error messages
- Screenshots of errors

#### Statistics
- Conversion rates (signups → paid)
- Churn rate (plan cancellations)
- Average alerts per user
- Most popular prefectures
- Detection patterns (by time of day)

---

## 8. BOOKING SYSTEM

### How It Works

1. **User Creates Alert** with:
   - Prefecture (e.g., Paris)
   - Procedure type (e.g., "Titre de séjour")
   - Plan (determines check frequency)

2. **Scraper Monitors** the prefecture website:
   - Navigates to booking page
   - Checks for available slots using CSS selectors
   - Takes screenshot if slots found
   - Records detection in database

3. **Notification Triggers** when slots detected:
   - Email with direct booking link
   - SMS with short link
   - Telegram message

4. **User Books** directly on prefecture website

### Supported Procedures

```typescript
enum Procedure {
  TITRE_SEJOUR         // Residence permit
  NATURALISATION       // Citizenship
  VISA                 // Visa
  CARTE_IDENTITE       // ID card
  PASSEPORT            // Passport
  PERMIS_CONDUIRE      // Driver's license
  CARTE_GRISE          // Vehicle registration
  AUTRE                // Other
}
```

### Prefecture Classification

| Tier | Check Interval | Use Case | Examples |
|------|----------------|----------|----------|
| **1** | 30 seconds | Critical high-demand | Paris, Bobigny, Créteil, Nanterre |
| **2** | 60 seconds | High demand | Lyon, Marseille, Toulouse, Lille |
| **3** | 120 seconds | Normal demand | All other prefectures |

---

## 9. SCRAPING AND MONITORING

### Scraper Architecture

#### Playwright Integration

Uses **Playwright** with anti-detection measures:

```typescript
import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';

chromium.use(stealth());
const browser = await chromium.launch({ headless: true });
```

#### Multi-Worker Pool

- **3+ Worker Instances** (configurable)
- Each handles subset of prefectures
- Parallel scraping for speed
- Shared Redis queue for coordination

#### Job Scheduling with BullMQ

```typescript
// Scraper Queue
const scraperQueue = new Queue('scraper', { connection: redis });

// Schedule repeatable jobs for each prefecture
await scraperQueue.add(
  `scrape:paris_75`,
  { prefectureId: 'paris_75' },
  {
    repeat: { every: 30000 }, // 30 seconds for Tier 1
    backoff: { type: 'exponential', delay: 5000 },
    attempts: 3,
  }
);
```

### Scraping Process Per Prefecture

1. **Navigate** to booking URL
2. **Handle Cookies** (accept consent popup)
3. **Select Procedure** (from dropdown if needed)
4. **Check for Slots**:
   - Look for "no slots" message
   - Count available slot elements
   - Extract date/time if available
5. **Take Screenshot** (proof of detection)
6. **Save Detection** to database
7. **Trigger Notifications** for affected users

### Anti-Detection Measures

To avoid being blocked by prefecture websites:

#### 1. Proxy Rotation
Use residential French proxies, rotate per request:

```typescript
const PROXY_LIST = [
  'http://user:pass@proxy1.fr:8080',
  'http://user:pass@proxy2.fr:8080',
  // ... 15+ more proxies
];

function getNextProxy() {
  return PROXY_LIST[Math.floor(Math.random() * PROXY_LIST.length)];
}
```

#### 2. User-Agent Rotation
Pool of 20+ real browsers:

```typescript
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...',
  // ... more agents
];
```

#### 3. Realistic Delays
Human-like waits between actions:

```typescript
async function humanDelay(min = 1000, max = 3000) {
  const delay = Math.random() * (max - min) + min;
  await page.waitForTimeout(delay);
}
```

#### 4. Browser Fingerprinting
Playwright stealth plugin:
- Disables `navigator.webdriver`
- Randomizes screen dimensions
- Fakes plugins array
- Consistent WebGL fingerprint

#### 5. Respecting Rate Limits
- Different proxies for same prefecture
- Spread checks across time
- Respect robots.txt guidelines
- Exponential backoff on errors

### CAPTCHA Handling

**Current Status:** Most prefectures don't require CAPTCHA, but some do.

**Options:**
1. **Skip prefectures with CAPTCHA** (not ideal)
2. **Use CAPTCHA solving service** (2go-CAPTCHA, Anti-Captcha, etc.)
3. **Manual verification** (user interaction)

### Error Handling

Scraper logs all errors:

```typescript
ScraperLog {
  status: 'error' | 'success' | 'captcha' | 'timeout',
  prefectureId: string,
  errorMessage?: string,
  responseTimeMs: number,
  screenshotPath?: string,
}
```

**Auto-pause after 5 consecutive errors** to avoid flooding.

---

## 10. NOTIFICATION SYSTEM

### Supported Channels

#### 1. Email (SendGrid/Resend)

```typescript
async function sendEmail(to: string, subject: string, html: string) {
  await resend.emails.send({
    from: 'alerte@rdvpriority.fr',
    to,
    subject,
    html,
  });
}
```

Template example:

```html
<div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
  <div style="background: #e1000f; color: white; padding: 20px; text-align: center;">
    <h1>🚨 CRÉNEAU DÉTECTÉ !</h1>
  </div>
  <div style="padding: 30px;">
    <h2>Paris (75)</h2>
    <p><strong>3 créneau(x) disponible(s)</strong></p>
    <p>Date: 15 Mars 2026 | 10:30</p>
    <a href="https://booking-link.fr" style="display: inline-block; background: #e1000f; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
      RÉSERVER MAINTENANT →
    </a>
  </div>
</div>
```

#### 2. SMS (Twilio)

```typescript
async function sendSms(to: string, body: string) {
  await twilio.messages.create({
    body,
    to,        // "+33612345678"
    from: process.env.TWILIO_PHONE_NUMBER,
  });
}
```

Example message:

```
🚨 RDVPriority: 3 créneau(x) à Paris! Réservez vite: https://rdv.short/booking
```

#### 3. Telegram Bot

```typescript
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
```

Example message:

```
🚨 CRÉNEAU DÉTECTÉ!

🏛️ Paris (75)
📅 3 créneau(x) disponible(s)
📆 Date: 15 Mars 2026 10:30

👉 RÉSERVER MAINTENANT
⚡ Les créneaux partent en minutes. Agissez maintenant!
```

### Notification Queue

All notifications go through BullMQ queue:

```typescript
const notificationQueue = new Queue('notifications');

// When slot detected:
await notificationQueue.add('email', {
  userId: user.id,
  channel: 'EMAIL',
  type: 'slot_detected',
  title: 'Créneau trouvé!',
  body: '3 créneaux disponibles à Paris',
  metadata: {
    prefectureId: 'paris_75',
    slotsAvailable: 3,
    bookingUrl: '...',
  },
}, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
});
```

### Notification Preferences

Users can configure:
- Which channels to use (email/SMS/Telegram)
- Notification frequency (instant vs. digest)
- Quiet hours (no notifications 12am-8am)
- Test notifications

---

## 11. WORKER SYSTEM

### Job Queue Architecture

Three separate BullMQ queues:

#### 1. Scraper Queue
```
Queue: 'scraper'
Jobs: Check prefecture for available slots
Frequency: Every 30-120 seconds per prefecture
Concurrency: 5-10 workers
Retries: 3 with exponential backoff
```

#### 2. Notification Queue
```
Queue: 'notifications'
Jobs: Send email/SMS/Telegram
Frequency: On-demand when slots detected
Concurrency: 20+ workers (fast)
Retries: 3 with exponential backoff
```

#### 3. Maintenance Queue
```
Queue: 'maintenance'
Jobs: Cleanup, stats update, health checks
Frequency: Every 1 minute
Concurrency: 1 worker
```

### Starting Workers

#### Scraper Workers
```bash
cd backend
npm run worker:scraper
# Or run multiple instances:
npm run worker:scraper &
npm run worker:scraper &
npm run worker:scraper &
```

#### Notification Workers
```bash
npm run worker:notifications
```

#### Maintenance Worker
```bash
npm run worker:maintenance
```

### Worker Monitoring

Via Boss Panel:
- View active jobs
- Retry failed jobs
- Monitor queue sizes
- See worker health

Via Command Line:
```bash
# Check queue status
npm run queue:status

# Drain queue (clear all jobs)
npm run queue:drain scraper

# Retry failed jobs
npm run queue:retry scraper
```

---

## 12. PAYMENT AND SUBSCRIPTION MANAGEMENT

### Pricing Plans

| Plan | Price | Duration | Alerts | Check Interval | Channels | Type |
|------|-------|----------|--------|----------------|----------|------|
| **URGENCE 24H** | €4.99 | 24 hours | 1 | 120s | Email | One-time |
| **URGENCE 7 JOURS** | €14.99 | 7 days | 3 | 60s | Email + Telegram | One-time |
| **URGENCE TOTAL** | €29.99/mo | Monthly | ∞ | 30s | All | Recurring |

### Payment Flow

#### One-Time Payment (24H & 7 Days)

1. User selects plan on frontend
2. Frontend POST `/api/billing/checkout` with plan
3. Backend creates Stripe checkout session
4. User redirected to Stripe checkout page
5. User pays with card
6. Stripe calls webhook `/api/billing/webhook`
7. Backend activates plan, expires in 24/7 days
8. User redirected to dashboard

#### Monthly Subscription (TOTAL)

1. User selects monthly plan
2. Stripe checkout session created in **subscription mode**
3. User pays (recurring)
4. Webhook activates plan
5. Plan auto-renews monthly (or user cancels)
6. Webhook handles `invoice.payment_succeeded` / `subscription.deleted`

### Stripe Integration

#### Setup

```bash
# Create Stripe account at stripe.com
# Get API keys:
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Create price IDs for each plan in Stripe dashboard:
STRIPE_PRICE_24H=price_...
STRIPE_PRICE_7J=price_...
STRIPE_PRICE_TOTAL=price_...

# Setup webhook endpoint:
https://api.rdvpriority.fr/api/billing/webhook
```

#### Webhook Events Handled

```typescript
// When payment completed
'checkout.session.completed' → Activate user's plan + save payment record

// When subscription renewed
'invoice.payment_succeeded' → Extend plan expiration date

// When subscription cancelled
'customer.subscription.deleted' → Deactivate plan, set to NONE
```

### Plan Expiration

Backend runs maintenance job every minute:

```typescript
// Find users with expired plans
const expiredPlans = await prisma.user.findMany({
  where: {
    planExpiresAt: { lt: new Date() },
  },
});

// Deactivate their alerts
for (const user of expiredPlans) {
  await prisma.alert.updateMany({
    where: { userId: user.id },
    data: { isActive: false },
  });
  
  await prisma.user.update({
    where: { id: user.id },
    data: { plan: 'NONE' },
  });
}
```

### Refunds

Refunds handled manually in Stripe dashboard → webhook auto-updates user record.

---

## 13. SECURITY AND AUTHENTICATION

### Password Security

- **Bcrypt** with salt rounds = 12
- Passwords never logged
- Password reset via email token (not implemented yet)

```typescript
import bcrypt from 'bcrypt';

// Hashing
const passwordHash = await bcrypt.hash(password, 12);

// Verification
const isValid = await bcrypt.compare(password, user.passwordHash);
```

### JWT Authentication

- **Payload:** `{ userId, email, iat, exp }`
- **Expiration:** 7 days
- **Secret:** Stored in environment variable
- **Renewal:** Refresh token endpoint (TODO)

```typescript
import jwt from 'jsonwebtoken';

// Create token
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// Verify token
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### API Security

#### Rate Limiting
- Auth routes: 100 requests/15 min per IP
- General routes: 1000 requests/15 min per IP
- Implemented with `express-rate-limit` + Redis store

#### CORS
- Only allow frontend origin
- Credentials allowed
- Safe headers only

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
```

#### Helmet Security Headers
- Content Security Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- HTTPS enforced

#### Input Validation
All inputs validated with **Zod** schemas:

```typescript
const createAlertSchema = z.object({
  prefectureId: z.string().min(1),
  procedure: z.enum(['TITRE_SEJOUR', 'PASSEPORT', ...]),
});

// In route
const input = createAlertSchema.parse(req.body); // Throws if invalid
```

#### SQL Injection Prevention
Prisma ORM prevents all SQL injection:

```typescript
// Always use Prisma (safe):
const user = await prisma.user.findUnique({
  where: { email: userInput.email }, // Parameterized
});

// Never use raw SQL with string concatenation
```

### Scraper Security

See section [Scraping and Monitoring](#9-scraping-and-monitoring) for proxy rotation, user-agent rotation, etc.

### Environment Variables

All sensitive data in `.env` file (never committed):

```env
DATABASE_URL=...
REDIS_URL=...
JWT_SECRET=...
STRIPE_SECRET_KEY=...
RESEND_API_KEY=...
TWILIO_ACCOUNT_SID=...
TELEGRAM_BOT_TOKEN=...
```

---

## 14. PERFORMANCE AND MONITORING

### Monitoring Tools

#### Application Monitoring (Sentry)

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

Reports:
- Errors and exceptions
- Performance metrics
- Database query performance
- API response times

#### Health Checks

```
GET /api/health

Response:
{
  "status": "healthy",
  "timestamp": "2026-03-02T10:30:00Z",
  "checks": {
    "database": "connected",
    "redis": "connected",
    "api": "responding",
    "scraper": "5 workers running"
  }
}
```

#### Logs

Structured logging with Winston:

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

logger.info('Slot detected', { prefectureId: 'paris_75', slotsCount: 3 });
```

### Performance Metrics

#### Database
- Connection pool size: 10
- Query timeout: 30s
- Slow query threshold: 1s
- Indexes on frequently queried columns

#### Cache (Redis)
- TTL: 5 minutes for most data
- Memory limit: 1GB
- Eviction policy: allkeys-lru

#### API Response Times
- Target: <100ms for most endpoints
- Monitor via Sentry

#### Scraper Performance
- Target: Complete all prefectures within check interval
- Currently: ~500ms per prefecture with proxy rotation
- Can handle 100 prefectures with 3 workers

### Database Optimization

#### Connection Pooling
```typescript
const prisma = new PrismaClient({
  log: ['info', 'warn'],
  errorFormat: 'pretty',
});
```

#### Query Optimization
- Use `.select()` to fetch only needed columns
- Batch queries when possible
- Avoid N+1 queries with `.include()` carefully

#### Indexes
```sql
-- Automatically created by Prisma:
CREATE INDEX "Alert_prefectureId_isActive_idx" ON "Alert"("prefectureId", "isActive");
CREATE INDEX "Alert_userId_idx" ON "Alert"("userId");
CREATE INDEX "Detection_prefectureId_detectedAt_idx" ON "Detection"("prefectureId", "detectedAt");
```

---

## 15. DEPLOYMENT AND DEVOPS

### Development Environment

```bash
# Start all services
docker-compose up -d

# Logs
docker-compose logs -f api
docker-compose logs -f scraper

# Stop
docker-compose down
```

### Production Environment

#### Option A: Single VPS (€10-15/month)

**Hetzner CX31:**
- 4 vCPU, 8GB RAM, 80GB SSD
- Ubuntu 22.04

**Services on same VPS:**
- PostgreSQL container
- Redis container
- API server container
- Scraper workers (3 instances)
- Nginx reverse proxy

```bash
docker-compose -f docker-compose.prod.yml up -d
```

#### Option B: Scaled Setup (€50-100+/month)

- **Load Balancer** (Hetzner LB, €6/month)
- **API Servers** (2x CX21, €12/month)
- **Scraper Workers** (3x CX21, €18/month)
- **Database** (Managed PostgreSQL, €15/month)
- **Redis** (Managed, Upstash or Redis Cloud, €10/month)
- **Domain + SSL** (€10/year)

### Docker Deployment

#### Build Images

```bash
# API
cd backend
docker build -t rdvpriority-api:latest .
docker tag rdvpriority-api rdvpriority-api:1.0

# Scraper
cd scraper
docker build -t rdvpriority-scraper:latest .

# Frontend
cd frontend
docker build -t rdvpriority-frontend:latest .
```

#### Production Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: rdvpriority
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: always

  api:
    image: rdvpriority-api:latest
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/rdvpriority
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
    ports:
      - "4000:4000"
    depends_on:
      - postgres
      - redis
    restart: always

  scraper:
    image: rdvpriority-scraper:latest
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/rdvpriority
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    deploy:
      replicas: 3
    depends_on:
      - postgres
      - redis
    restart: always
    mem_limit: 2g

  frontend:
    image: rdvpriority-frontend:latest
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: https://api.rdvpriority.fr
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certbot/conf:/etc/letsencrypt
    depends_on:
      - api
      - frontend
    restart: always

volumes:
  postgres_data:
  redis_data:
```

### SSL/HTTPS

Using Let's Encrypt with Certbot:

```bash
# Initialize SSL
./scripts/init-ssl.sh

# Auto-renewal (cron job every month)
0 0 1 * * certbot renew && systemctl reload nginx
```

### Database Backups

Automated daily backups:

```bash
# Backup script (scripts/backup-db.sh)
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > /backups/rdvpriority_$TIMESTAMP.sql
gzip /backups/rdvpriority_$TIMESTAMP.sql

# Cron job
0 2 * * * /path/to/backup-db.sh
```

### Deployment Process

```bash
# 1. Build new images
git pull
docker build -t rdvpriority-api:v2.0 backend/
docker build -t rdvpriority-scraper:v2.0 scraper/

# 2. Run migrations
docker exec rdvpriority-api npx prisma migrate deploy

# 3. Update and restart
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# 4. Verify health
curl https://api.rdvpriority.fr/api/health
```

---

## 16. DEVELOPMENT GUIDELINES

### Code Standards

#### TypeScript
- Strict mode enabled
- No `any` types without justification
- All functions typed

#### Naming Conventions
- Files: kebab-case (`user-service.ts`)
- Variables: camelCase (`userId`, `isActive`)
- Classes: PascalCase (`UserService`, `EmailNotification`)
- Constants: UPPER_SNAKE_CASE (`MAX_ALERTS`, `TIER_1_INTERVAL`)

#### Code Comments
```typescript
// ✅ Good - explains WHY
// Tier 1 prefectures checked every 30s due to high demand and quick slot availability
const TIER_1_CHECK_INTERVAL = 30 * 1000;

// ❌ Bad - obvious from code
// Set interval to 30 seconds
const TIER_1_CHECK_INTERVAL = 30 * 1000;
```

#### Error Handling
```typescript
try {
  const slots = await scrapePrefecture(config);
} catch (error) {
  if (error instanceof TimeoutError) {
    logger.warn('Prefecture timeout', { prefectureId: config.id });
    // Continue to next prefecture
  } else if (error instanceof CaptchaDetectedError) {
    await pausePrefecture(config.id);
    logger.error('CAPTCHA detected', { prefectureId: config.id });
  } else {
    logger.error('Unexpected error', { error, prefectureId: config.id });
    throw error;
  }
}
```

### Testing

#### Unit Tests
```bash
npm run test
npm run test:watch
```

#### Integration Tests
```bash
# With Docker services running
npm run test:integration
```

#### Test Coverage
Target: >80% for critical paths
- Auth/JWT
- Payment processing
- Database operations
- Notification delivery

### Git Workflow

```bash
# Create feature branch
git checkout -b feat/add-sms-notifications

# Commit with conventional commits
git commit -m "feat: add SMS notifications via Twilio"
git commit -m "fix: handle timeout in CAPTCHA detection"
git commit -m "docs: update API documentation"

# Push and create PR
git push origin feat/add-sms-notifications

# After review and approval:
git merge --squash feat/add-sms-notifications
git push origin main

# Deploy
./scripts/deploy.sh
```

### Debugging

#### Enable Debug Logs
```bash
# Run with full debug output
DEBUG=* npm run dev

# Or specific module
DEBUG=scraper:* npm run dev
```

#### Browser DevTools
- Frontend: `npm run dev` then `localhost:3000`
- Inspect Network tab for API calls
- Check React DevTools for component state

#### Database Inspection
```bash
# Connect to production DB
psql $DATABASE_URL

# View schema
\dt

# Query data
SELECT * FROM "User" LIMIT 10;
```

#### Redis Inspection
```bash
# Connect to Redis
redis-cli -u redis://:password@localhost:6379

# View keys
KEYS *

# Check queue
HGETALL scraper:jobs

# Monitor live events
MONITOR
```

---

## 17. TROUBLESHOOTING AND FAQ

### Common Issues

#### Issue: "Scraper not finding slots even though I see them on the website"

**Causes:**
1. CSS selectors are outdated (website redesigned)
2. Slots loaded dynamically (AJAX)
3. Website blocked the IP

**Solutions:**
1. Check selectors: Open DevTools (F12) on prefecture site, inspect HTML
2. Add wait for selector: `await page.waitForSelector('.slot-available', { timeout: 5000 })`
3. Rotate proxies: Add new French residential proxies

#### Issue: "Too many CAPTCHA blocks"

**Causes:**
1. Same IP hitting site too frequently
2. Bot signature detected (User-Agent, headers)

**Solutions:**
1. Add more proxies
2. Increase delays between requests
3. Enable stealth plugin: `chromium.use(stealth())`

#### Issue: "API returning 401 Unauthorized"

**Causes:**
1. JWT token expired
2. Token not included in Authorization header
3. Secret key changed

**Solutions:**
1. User must login again to get new token
2. Frontend should check token on each request
3. Check `.env` JWT_SECRET matches

#### Issue: "Email/SMS not being sent"

**Causes:**
1. Notification worker not running
2. API key invalid (SendGrid/Twilio)
3. User doesn't have permission (wrong plan)

**Solutions:**
1. Check worker process: `ps aux | grep worker`
2. Verify API keys in `.env`
3. Check user plan and notification preferences

#### Issue: "High memory usage on scraper"

**Causes:**
1. Browser instances not closing
2. Screenshots accumulating
3. Too many jobs queued

**Solutions:**
1. Always call `browser.close()` in finally block
2. Clean old screenshots: `rm screenshots/*.png`
3. Reduce concurrent workers

### Performance Tips

#### Improve Scraper Speed
1. Use smaller screenshot resolution
2. Disable images in Playwright
3. Reduce number of retries
4. Increase proxy pool size

#### Reduce Database Load
1. Cache prefecture status in Redis
2. Batch insert detections
3. Archive old logs (>30 days)
4. Use connection pooling (Prisma does this)

#### Cut Notification Delays
1. Use priority queue for important users
2. Parallel notification sending
3. Batch email delivery

### Monitoring Checklist

Daily:
- [ ] API health endpoint responding
- [ ] Database backups completed
- [ ] Scraper workers running (3 active)
- [ ] No spike in error logs

Weekly:
- [ ] Detection rate normal
- [ ] Average detection time <5 minutes
- [ ] Notification delivery >98%
- [ ] No alerts expired

Monthly:
- [ ] Database size reasonable
- [ ] Scraper logs archived
- [ ] Disk space available
- [ ] SSL certificate renewal (auto)

### FAQ

**Q: How many prefectures can one scraper worker handle?**
A: Each worker can handle 30-50 prefectures, checking every 120s. For 101 prefectures at 30s intervals (Tier 1), you need 3 workers minimum.

**Q: What if a prefecture changes their booking URL?**
A: Scraper will fail, error logged, prefecture paused after 5 consecutive errors. Admin gets alert in Boss Panel, manually updates URL in database.

**Q: Can users have multiple alerts for same prefecture?**
A: Yes, for different procedures (TITRE_SEJOUR vs PASSEPORT). Same prefecture+procedure = not allowed (prevents duplicates).

**Q: What happens when a user's plan expires?**
A: All their alerts auto-disabled. Scraper stops checking. They can re-activate by upgrading plan.

**Q: Is the service GDPR compliant?**
A: Partial. Implementing:
- [ ] Data export for users
- [ ] Right to be forgotten
- [ ] Privacy policy
- [ ] DPA with notification providers

---

## 18. PREFECTURE CONFIGURATIONS

### Understanding Prefecture Systems

French prefectures use **4 main booking systems**:

| System | # Prefectures | Difficulty | Approach |
|--------|--------------|------------|----------|
| **ANTS** | ~40 | ⭐ Easy | Centralized `rdv-prefecture.interieur.gouv.fr` |
| **Préfecture en ligne** | ~20 | ⭐ Easy | Common platform, shared selectors |
| **Custom** | ~30 | ⭐⭐⭐ Hard | Each unique, custom scraper needed |
| **Third-party** | ~11 | ⭐⭐ Medium | Doctolib, JDC, etc. |

### ANTS System (Easiest)

**Used by:** Paris (modified), Bobigny, Créteil, Nanterre, Évry, etc.

**Shared Selectors:**
```typescript
const ANTS_SELECTORS = {
  procedureList: '.demarche-list .demarche-item, .list-group-item',
  procedureButton: 'a.btn, button.demarche-link',
  availableSlot: '.slot-available, .creneau-disponible, .calendar-day.available',
  noSlotMessage: '.alert-warning, .no-slot-message',
  slotDate: '.date-creneau, .slot-date',
  slotTime: '.heure-creneau, .slot-time',
  cookieAccept: '#cookie-consent-accept, .tarteaucitronAllow',
  nextButton: '.btn-primary, button[type="submit"]',
};
```

### RDV-Préfecture System

**URL Pattern:** `https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/{DEMARCHE_ID}/`

**Used by:** Most Île-de-France prefectures (Créteil, Nanterre, Évry, Versailles, etc.)

**Special:** ⚠️ CAPTCHA on Step 2 (security code image)

### Custom Systems (Hardest)

**Examples:** Paris (uses rendezvouspasseport.ants.gouv.fr), Some rural prefectures

**Process:**
1. Visit prefecture website manually
2. Open Chrome DevTools (F12)
3. Navigate through booking flow
4. Identify CSS selectors for each step
5. Create custom config

### Tier 1 Prefectures (Check Every 30 seconds)

These are most requested:

```
Paris (75) - Île-de-France
Bobigny (93) - Seine-Saint-Denis
Créteil (94) - Val-de-Marne
Nanterre (92) - Hauts-de-Seine
Évry (91) - Essonne
Cergy-Pontoise (95) - Val-d'Oise
Melun (77) - Seine-et-Marne
Versailles (78) - Yvelines
```

### Tier 2 Prefectures (Check Every 60 seconds)

Major cities:

```
Lyon (69), Marseille (13), Toulouse (31), Lille (59)
Nantes (44), Bordeaux (33), Montpellier (34), Strasbourg (67)
Nice (06), Rouen (76), Rennes (35), Grenoble (38)
```

### Finding Real Booking URLs

**Important:** Official URLs frequently change. Must verify manually:

```
1. Go to https://www.{department}.gouv.fr
2. Search for "rendez-vous" or "prendre rendez-vous"
3. Find actual booking link (may redirect)
4. Note final URL after all redirects
5. Open DevTools (F12) and inspect HTML
```

### Configuration Template

```typescript
interface PrefectureConfig {
  id: string;                    // "paris_75"
  name: string;                  // "Paris"
  department: string;            // "75"
  region: string;                // "Île-de-France"
  tier: 1 | 2 | 3;              // Check frequency tier
  
  bookingUrl: string;            // https://...
  alternateUrls?: string[];      // Fallback URLs
  bookingSystem: 'ants' | 'custom' | 'rdv-prefecture' | 'prefenligne';
  
  selectors: {
    cookieAccept?: string;
    procedureDropdown?: string;
    procedureValue?: string;
    nextButton?: string;
    availableSlot: string;
    noSlotMessage?: string;
    slotDate?: string;
    slotTime?: string;
    captchaDetect?: string;
  };
  
  procedures: {
    value: string;
    label: string;
    type: Procedure;
  }[];
  
  checkInterval: number;         // Seconds (30/60/120)
  proxy?: string;               // Specific proxy (optional)
}
```

### Implementation Order

**Phase 1 (Launch):**
- Focus on 8 Île-de-France prefectures only
- Represents 80% of demand
- Test extensively

**Phase 2 (Growth):**
- Add 12 major cities (Tier 2)
- Total: 20 prefectures

**Phase 3 (Scale):**
- Add remaining 81 prefectures
- Most use same ANTS system

**Phase 4 (Automation):**
- Auto-detect booking system
- Auto-generate selectors

---

## COST ESTIMATES

### Infrastructure Costs (Monthly)

| Item | Cost | Notes |
|------|------|-------|
| VPS (Hetzner CX31) | €10-15 | 4 vCPU, 8GB RAM, 80GB SSD |
| Residential Proxies | €15-50 | 10-20 French IPs (SmartProxy/Bright Data) |
| Resend (email) | €0-20 | Free: 3000/month, $0.10 per additional |
| Twilio (SMS) | €5-30 | ~€0.07 per SMS to France |
| Domain + SSL | €0.83/mo | €10/year, auto-renews |
| Monitoring (Sentry) | €0 | Free tier sufficient |
| **TOTAL** | **€30-115** | Scalable with growth |

### Revenue Potential

| Scenario | Users | Monthly Revenue |
|----------|-------|-----------------|
| **Conservative** | 50 | €750 |
| **Moderate** | 200 | €3,000 |
| **Growth** | 500 | €7,500 |
| **Scale** | 2000 | €30,000 |

---

## APPENDIX: API RESPONSE EXAMPLES

### Login Response

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-123",
    "email": "user@example.com",
    "plan": "URGENCE_TOTAL",
    "planExpiresAt": "2026-04-02T10:30:00Z",
    "alertsCount": 3,
    "notifyEmail": true,
    "notifyTelegram": true,
    "notifySms": false
  }
}
```

### Create Alert Response

```json
{
  "id": "alert-uuid-123",
  "userId": "user-uuid",
  "prefectureId": "paris_75",
  "procedure": "TITRE_SEJOUR",
  "isActive": true,
  "lastCheckedAt": null,
  "slotsFound": 0,
  "notificationsSent": 0,
  "createdAt": "2026-03-02T10:30:00Z",
  "updatedAt": "2026-03-02T10:30:00Z"
}
```

### Detection Response

```json
{
  "id": "detection-uuid-123",
  "alertId": "alert-uuid-123",
  "prefectureId": "paris_75",
  "slotsAvailable": 3,
  "slotDate": "2026-03-15",
  "slotTime": "10:30",
  "bookingUrl": "https://rendezvouspasseport.ants.gouv.fr/...",
  "screenshotPath": "s3://bucket/screenshots/paris_75_2026030210300.png",
  "detectedAt": "2026-03-02T10:30:00Z"
}
```

### Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2026-03-02T10:30:00Z",
  "checks": {
    "database": "connected",
    "redis": "connected",
    "api": "responding",
    "scraper": "5 workers running",
    "notifications": "queue running"
  },
  "uptime": "15 days 3 hours"
}
```

---

## Document Information

**Last Updated:** March 2, 2026
**Compiled From:**
- README.md
- BACKEND_SPEC.md
- PREFECTURES_GUIDE.md
- PREFECTURE_TRAINING.md

**Next Update:** When major features added or systems changed

**Contact:** For questions about implementation, see the relevant section above
