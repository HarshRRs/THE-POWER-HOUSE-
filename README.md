# 🇫🇷 RDVPriority.fr

> The fastest way to get prefecture appointments in France.

Monitor 101 French prefectures for available appointment slots. Get instant alerts via Email, Telegram, or SMS.

## 🏗️ Architecture

```
rdvpriority/
├── frontend/        → Next.js 14, TailwindCSS (port 3000)
├── backend/         → Express.js API (port 4000)
├── scraper/         → Playwright scraper workers
└── docker-compose.yml → PostgreSQL + Redis
```

## 🚀 Quick Start

### 1. Start Infrastructure
```bash
docker-compose up -d
```

### 2. Start Backend
```bash
cd backend
npm install
npm run dev
```

### 3. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Run Scraper
```bash
cd scraper
npm install
npm start
```

## 📊 Prefectures (Top 10)

| Prefecture | Dept | Demand | Priority |
|-----------|------|--------|----------|
| Paris | 75 | ⭐⭐⭐⭐⭐ | Tier 1 |
| Bobigny | 93 | ⭐⭐⭐⭐⭐ | Tier 1 |
| Créteil | 94 | ⭐⭐⭐⭐ | Tier 1 |
| Nanterre | 92 | ⭐⭐⭐⭐ | Tier 1 |
| Lyon | 69 | ⭐⭐⭐⭐ | Tier 2 |
| Évry | 91 | ⭐⭐⭐⭐ | Tier 2 |
| Marseille | 13 | ⭐⭐⭐ | Tier 3 |
| Lille | 59 | ⭐⭐⭐ | Tier 3 |
| Bordeaux | 33 | ⭐⭐⭐ | Tier 3 |
| Toulouse | 31 | ⭐⭐⭐ | Tier 3 |

## 💳 Pricing Plans

- **Free**: 1 prefecture, email alerts
- **Pro** (€9.99/mo): 5 prefectures, Email + Telegram
- **VIP** (€19.99/mo): All prefectures, Email + Telegram + SMS

## 🔧 Tech Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **Backend**: Node.js, Express
- **Scraper**: Playwright
- **Database**: PostgreSQL
- **Queue**: Redis + BullMQ
- **Notifications**: SendGrid, Telegram Bot API

## 📄 License

Private — All rights reserved.
