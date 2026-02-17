# 🇫🇷 ALL 101 FRENCH PREFECTURES — Booking URLs & Scraping Guide

## HOW TO USE THIS FILE

Give this file to an AI with the `BACKEND_SPEC.md` and say:
> "Here are all 101 French prefectures with their booking systems. Build the scraper configs for each one using the strategies described."

---

## BOOKING SYSTEMS OVERVIEW

French prefectures use **4 main booking systems**. Knowing which system a prefecture uses determines your scraping strategy:

| System | # Prefectures | Difficulty | Strategy |
|--------|--------------|------------|----------|
| **ANTS / RDV Préfecture** | ~40 | ⭐ Easy | Centralized platform at `rdv-prefecture.interieur.gouv.fr` — shared selectors |
| **Préfecture en ligne** | ~20 | ⭐ Easy | Common platform — shared selectors |
| **Custom (proprietary)** | ~30 | ⭐⭐⭐ Hard | Each has unique DOM — must inspect each one |
| **Third-party** (JDC, Doctolib) | ~11 | ⭐⭐ Medium | Known platforms with predictable DOM |

---

## SCRAPING STRATEGY BY SYSTEM

### Strategy 1: ANTS / RDV Préfecture (Easiest — ~40 prefectures)

**URL Pattern:** `https://rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/{prefecture_id}/`

This is the **centralized government booking platform**. Many prefectures redirect here. Same DOM structure for all.

```typescript
// SHARED SELECTORS for ALL ANTS prefectures:
const ANTS_SELECTORS = {
  // Step 1: Select procedure
  procedureList: '.demarche-list .demarche-item, .list-group-item',
  procedureButton: 'a.btn, button.demarche-link',
  
  // Step 2: Check availability
  availableSlot: '.slot-available, .creneau-disponible, .calendar-day.available',
  noSlotMessage: '.alert-warning, .no-slot-message, .aucun-creneau-disponible',
  
  // Step 3: Date/time if available
  slotDate: '.date-creneau, .slot-date',
  slotTime: '.heure-creneau, .slot-time',
  
  // Common
  cookieAccept: '#cookie-consent-accept, .tarteaucitronAllow, .cookie-accept-btn',
  captchaDetect: 'iframe[src*="recaptcha"], iframe[src*="hcaptcha"], .g-recaptcha',
  nextButton: '.btn-primary, .btn-next, button[type="submit"]',
};

// SCRAPING FLOW:
// 1. Go to URL
// 2. Accept cookies if prompt appears
// 3. Select procedure from list (titre de séjour, etc.)
// 4. Click submit/next
// 5. Wait for calendar/slot page to load
// 6. Check for .slot-available or .no-slot-message
// 7. If slots found → extract date/time, screenshot, notify users
```

### Strategy 2: Custom Prefecture Sites (Hardest — ~30 prefectures)

Each has its own DOM. You must:
1. Visit the URL manually
2. Open Chrome DevTools (F12)
3. Navigate through the booking flow
4. Identify CSS selectors for: procedure dropdown, calendar, available slots, "no slots" message
5. Create a custom config

```typescript
// GENERIC APPROACH for custom sites:
async function scrapeCustomPrefecture(config: PrefectureConfig, page: Page) {
  await page.goto(config.bookingUrl, { waitUntil: 'networkidle', timeout: 30000 });
  
  // Handle cookies
  await page.click(config.selectors.cookieAccept).catch(() => {});
  await page.waitForTimeout(1000);
  
  // Select procedure if dropdown exists
  if (config.selectors.procedureDropdown) {
    await page.selectOption(config.selectors.procedureDropdown, config.procedureValue);
    await page.waitForTimeout(2000);
  }
  
  // Click "next" button if flow is multi-step
  if (config.selectors.nextButton) {
    await page.click(config.selectors.nextButton);
    await page.waitForTimeout(3000);
  }
  
  // Check for available slots
  const noSlot = await page.$(config.selectors.noSlotMessage);
  if (noSlot) return { status: 'no_slots', slotsAvailable: 0 };
  
  const slots = await page.$$(config.selectors.availableSlot);
  if (slots.length > 0) {
    const date = await page.textContent(config.selectors.slotDate).catch(() => null);
    const time = await page.textContent(config.selectors.slotTime).catch(() => null);
    return { status: 'slots_found', slotsAvailable: slots.length, slotDate: date, slotTime: time };
  }
  
  return { status: 'no_slots', slotsAvailable: 0 };
}
```

### Strategy 3: Préfecture en Ligne (~20 prefectures)

Shared platform similar to ANTS. Look for URL pattern: `pprdv.*` or `prefecture-en-ligne`.

### Strategy 4: Third-Party (Doctolib, JDC)

Some prefectures redirect to Doctolib or JDC (Journée de Citoyenneté) for booking. Use the platform's predictable DOM.

---

## ALL 101 PREFECTURES

### 🔴 TIER 1 — CRITICAL (Check every 30s)

Île-de-France region. Highest demand, hardest to book. Maximum priority.

| # | Dept | Prefecture | Booking URL | System | Notes |
|---|------|-----------|-------------|--------|-------|
| 1 | **75** | **Paris** | `https://www.prefecturedepolice.interieur.gouv.fr/demarches/rendez-vous` | Custom | Préfecture de Police — separate system from other prefectures. Highest volume. |
| 2 | **92** | **Nanterre** (Hauts-de-Seine) | `https://www.hauts-de-seine.gouv.fr/booking/create` | ANTS | |
| 3 | **93** | **Bobigny** (Seine-Saint-Denis) | `https://www.seine-saint-denis.gouv.fr/booking/create` | ANTS | Second highest demand after Paris |
| 4 | **94** | **Créteil** (Val-de-Marne) | `https://www.val-de-marne.gouv.fr/booking/create` | ANTS | |
| 5 | **91** | **Évry** (Essonne) | `https://www.essonne.gouv.fr/booking/create` | ANTS | |
| 6 | **95** | **Cergy-Pontoise** (Val-d'Oise) | `https://www.val-d-oise.gouv.fr/booking/create` | ANTS | |
| 7 | **77** | **Melun** (Seine-et-Marne) | `https://www.seine-et-marne.gouv.fr/booking/create` | ANTS | |
| 8 | **78** | **Versailles** (Yvelines) | `https://www.yvelines.gouv.fr/booking/create` | ANTS | |

### 🟠 TIER 2 — HIGH DEMAND (Check every 60s)

Major French cities outside Paris region.

| # | Dept | Prefecture | Booking URL | System | Notes |
|---|------|-----------|-------------|--------|-------|
| 9 | **69** | **Lyon** (Rhône) | `https://www.rhone.gouv.fr/booking/create` | ANTS | Second largest city |
| 10 | **13** | **Marseille** (Bouches-du-Rhône) | `https://www.bouches-du-rhone.gouv.fr/booking/create` | ANTS | Third largest city |
| 11 | **31** | **Toulouse** (Haute-Garonne) | `https://www.haute-garonne.gouv.fr/booking/create` | ANTS | |
| 12 | **59** | **Lille** (Nord) | `https://www.nord.gouv.fr/booking/create` | ANTS | |
| 13 | **44** | **Nantes** (Loire-Atlantique) | `https://www.loire-atlantique.gouv.fr/booking/create` | ANTS | |
| 14 | **33** | **Bordeaux** (Gironde) | `https://www.gironde.gouv.fr/booking/create` | ANTS | |
| 15 | **34** | **Montpellier** (Hérault) | `https://www.herault.gouv.fr/booking/create` | ANTS | |
| 16 | **67** | **Strasbourg** (Bas-Rhin) | `https://www.bas-rhin.gouv.fr/booking/create` | ANTS | |
| 17 | **06** | **Nice** (Alpes-Maritimes) | `https://www.alpes-maritimes.gouv.fr/booking/create` | ANTS | |
| 18 | **76** | **Rouen** (Seine-Maritime) | `https://www.seine-maritime.gouv.fr/booking/create` | ANTS | |
| 19 | **35** | **Rennes** (Ille-et-Vilaine) | `https://www.ille-et-vilaine.gouv.fr/booking/create` | ANTS | |
| 20 | **38** | **Grenoble** (Isère) | `https://www.isere.gouv.fr/booking/create` | ANTS | |

### 🟢 TIER 3 — STANDARD (Check every 120s)

All remaining metropolitan prefectures.

| # | Dept | Prefecture | Booking URL | System |
|---|------|-----------|-------------|--------|
| 21 | **01** | **Bourg-en-Bresse** (Ain) | `https://www.ain.gouv.fr/booking/create` | ANTS |
| 22 | **02** | **Laon** (Aisne) | `https://www.aisne.gouv.fr/booking/create` | ANTS |
| 23 | **03** | **Moulins** (Allier) | `https://www.allier.gouv.fr/booking/create` | ANTS |
| 24 | **04** | **Digne-les-Bains** (Alpes-de-Haute-Provence) | `https://www.alpes-de-haute-provence.gouv.fr/booking/create` | ANTS |
| 25 | **05** | **Gap** (Hautes-Alpes) | `https://www.hautes-alpes.gouv.fr/booking/create` | ANTS |
| 26 | **07** | **Privas** (Ardèche) | `https://www.ardeche.gouv.fr/booking/create` | ANTS |
| 27 | **08** | **Charleville-Mézières** (Ardennes) | `https://www.ardennes.gouv.fr/booking/create` | ANTS |
| 28 | **09** | **Foix** (Ariège) | `https://www.ariege.gouv.fr/booking/create` | ANTS |
| 29 | **10** | **Troyes** (Aube) | `https://www.aube.gouv.fr/booking/create` | ANTS |
| 30 | **11** | **Carcassonne** (Aude) | `https://www.aude.gouv.fr/booking/create` | ANTS |
| 31 | **12** | **Rodez** (Aveyron) | `https://www.aveyron.gouv.fr/booking/create` | ANTS |
| 32 | **14** | **Caen** (Calvados) | `https://www.calvados.gouv.fr/booking/create` | ANTS |
| 33 | **15** | **Aurillac** (Cantal) | `https://www.cantal.gouv.fr/booking/create` | ANTS |
| 34 | **16** | **Angoulême** (Charente) | `https://www.charente.gouv.fr/booking/create` | ANTS |
| 35 | **17** | **La Rochelle** (Charente-Maritime) | `https://www.charente-maritime.gouv.fr/booking/create` | ANTS |
| 36 | **18** | **Bourges** (Cher) | `https://www.cher.gouv.fr/booking/create` | ANTS |
| 37 | **19** | **Tulle** (Corrèze) | `https://www.correze.gouv.fr/booking/create` | ANTS |
| 38 | **2A** | **Ajaccio** (Corse-du-Sud) | `https://www.corse-du-sud.gouv.fr/booking/create` | ANTS |
| 39 | **2B** | **Bastia** (Haute-Corse) | `https://www.haute-corse.gouv.fr/booking/create` | ANTS |
| 40 | **21** | **Dijon** (Côte-d'Or) | `https://www.cote-dor.gouv.fr/booking/create` | ANTS |
| 41 | **22** | **Saint-Brieuc** (Côtes-d'Armor) | `https://www.cotes-darmor.gouv.fr/booking/create` | ANTS |
| 42 | **23** | **Guéret** (Creuse) | `https://www.creuse.gouv.fr/booking/create` | ANTS |
| 43 | **24** | **Périgueux** (Dordogne) | `https://www.dordogne.gouv.fr/booking/create` | ANTS |
| 44 | **25** | **Besançon** (Doubs) | `https://www.doubs.gouv.fr/booking/create` | ANTS |
| 45 | **26** | **Valence** (Drôme) | `https://www.drome.gouv.fr/booking/create` | ANTS |
| 46 | **27** | **Évreux** (Eure) | `https://www.eure.gouv.fr/booking/create` | ANTS |
| 47 | **28** | **Chartres** (Eure-et-Loir) | `https://www.eure-et-loir.gouv.fr/booking/create` | ANTS |
| 48 | **29** | **Quimper** (Finistère) | `https://www.finistere.gouv.fr/booking/create` | ANTS |
| 49 | **30** | **Nîmes** (Gard) | `https://www.gard.gouv.fr/booking/create` | ANTS |
| 50 | **32** | **Auch** (Gers) | `https://www.gers.gouv.fr/booking/create` | ANTS |
| 51 | **36** | **Châteauroux** (Indre) | `https://www.indre.gouv.fr/booking/create` | ANTS |
| 52 | **37** | **Tours** (Indre-et-Loire) | `https://www.indre-et-loire.gouv.fr/booking/create` | ANTS |
| 53 | **39** | **Lons-le-Saunier** (Jura) | `https://www.jura.gouv.fr/booking/create` | ANTS |
| 54 | **40** | **Mont-de-Marsan** (Landes) | `https://www.landes.gouv.fr/booking/create` | ANTS |
| 55 | **41** | **Blois** (Loir-et-Cher) | `https://www.loir-et-cher.gouv.fr/booking/create` | ANTS |
| 56 | **42** | **Saint-Étienne** (Loire) | `https://www.loire.gouv.fr/booking/create` | ANTS |
| 57 | **43** | **Le Puy-en-Velay** (Haute-Loire) | `https://www.haute-loire.gouv.fr/booking/create` | ANTS |
| 58 | **45** | **Orléans** (Loiret) | `https://www.loiret.gouv.fr/booking/create` | ANTS |
| 59 | **46** | **Cahors** (Lot) | `https://www.lot.gouv.fr/booking/create` | ANTS |
| 60 | **47** | **Agen** (Lot-et-Garonne) | `https://www.lot-et-garonne.gouv.fr/booking/create` | ANTS |
| 61 | **48** | **Mende** (Lozère) | `https://www.lozere.gouv.fr/booking/create` | ANTS |
| 62 | **49** | **Angers** (Maine-et-Loire) | `https://www.maine-et-loire.gouv.fr/booking/create` | ANTS |
| 63 | **50** | **Saint-Lô** (Manche) | `https://www.manche.gouv.fr/booking/create` | ANTS |
| 64 | **51** | **Châlons-en-Champagne** (Marne) | `https://www.marne.gouv.fr/booking/create` | ANTS |
| 65 | **52** | **Chaumont** (Haute-Marne) | `https://www.haute-marne.gouv.fr/booking/create` | ANTS |
| 66 | **53** | **Laval** (Mayenne) | `https://www.mayenne.gouv.fr/booking/create` | ANTS |
| 67 | **54** | **Nancy** (Meurthe-et-Moselle) | `https://www.meurthe-et-moselle.gouv.fr/booking/create` | ANTS |
| 68 | **55** | **Bar-le-Duc** (Meuse) | `https://www.meuse.gouv.fr/booking/create` | ANTS |
| 69 | **56** | **Vannes** (Morbihan) | `https://www.morbihan.gouv.fr/booking/create` | ANTS |
| 70 | **57** | **Metz** (Moselle) | `https://www.moselle.gouv.fr/booking/create` | ANTS |
| 71 | **58** | **Nevers** (Nièvre) | `https://www.nievre.gouv.fr/booking/create` | ANTS |
| 72 | **60** | **Beauvais** (Oise) | `https://www.oise.gouv.fr/booking/create` | ANTS |
| 73 | **61** | **Alençon** (Orne) | `https://www.orne.gouv.fr/booking/create` | ANTS |
| 74 | **62** | **Arras** (Pas-de-Calais) | `https://www.pas-de-calais.gouv.fr/booking/create` | ANTS |
| 75 | **63** | **Clermont-Ferrand** (Puy-de-Dôme) | `https://www.puy-de-dome.gouv.fr/booking/create` | ANTS |
| 76 | **64** | **Pau** (Pyrénées-Atlantiques) | `https://www.pyrenees-atlantiques.gouv.fr/booking/create` | ANTS |
| 77 | **65** | **Tarbes** (Hautes-Pyrénées) | `https://www.hautes-pyrenees.gouv.fr/booking/create` | ANTS |
| 78 | **66** | **Perpignan** (Pyrénées-Orientales) | `https://www.pyrenees-orientales.gouv.fr/booking/create` | ANTS |
| 79 | **68** | **Colmar** (Haut-Rhin) | `https://www.haut-rhin.gouv.fr/booking/create` | ANTS |
| 80 | **70** | **Vesoul** (Haute-Saône) | `https://www.haute-saone.gouv.fr/booking/create` | ANTS |
| 81 | **71** | **Mâcon** (Saône-et-Loire) | `https://www.saone-et-loire.gouv.fr/booking/create` | ANTS |
| 82 | **72** | **Le Mans** (Sarthe) | `https://www.sarthe.gouv.fr/booking/create` | ANTS |
| 83 | **73** | **Chambéry** (Savoie) | `https://www.savoie.gouv.fr/booking/create` | ANTS |
| 84 | **74** | **Annecy** (Haute-Savoie) | `https://www.haute-savoie.gouv.fr/booking/create` | ANTS |
| 85 | **79** | **Niort** (Deux-Sèvres) | `https://www.deux-sevres.gouv.fr/booking/create` | ANTS |
| 86 | **80** | **Amiens** (Somme) | `https://www.somme.gouv.fr/booking/create` | ANTS |
| 87 | **81** | **Albi** (Tarn) | `https://www.tarn.gouv.fr/booking/create` | ANTS |
| 88 | **82** | **Montauban** (Tarn-et-Garonne) | `https://www.tarn-et-garonne.gouv.fr/booking/create` | ANTS |
| 89 | **83** | **Toulon** (Var) | `https://www.var.gouv.fr/booking/create` | ANTS |
| 90 | **84** | **Avignon** (Vaucluse) | `https://www.vaucluse.gouv.fr/booking/create` | ANTS |
| 91 | **85** | **La Roche-sur-Yon** (Vendée) | `https://www.vendee.gouv.fr/booking/create` | ANTS |
| 92 | **86** | **Poitiers** (Vienne) | `https://www.vienne.gouv.fr/booking/create` | ANTS |
| 93 | **87** | **Limoges** (Haute-Vienne) | `https://www.haute-vienne.gouv.fr/booking/create` | ANTS |
| 94 | **88** | **Épinal** (Vosges) | `https://www.vosges.gouv.fr/booking/create` | ANTS |
| 95 | **89** | **Auxerre** (Yonne) | `https://www.yonne.gouv.fr/booking/create` | ANTS |
| 96 | **90** | **Belfort** (Territoire de Belfort) | `https://www.territoire-de-belfort.gouv.fr/booking/create` | ANTS |

### 🌊 OVERSEAS TERRITORIES (Check every 300s)

| # | Dept | Prefecture | Booking URL | System |
|---|------|-----------|-------------|--------|
| 97 | **971** | **Basse-Terre** (Guadeloupe) | `https://www.guadeloupe.gouv.fr/booking/create` | ANTS |
| 98 | **972** | **Fort-de-France** (Martinique) | `https://www.martinique.gouv.fr/booking/create` | ANTS |
| 99 | **973** | **Cayenne** (Guyane) | `https://www.guyane.gouv.fr/booking/create` | ANTS |
| 100 | **974** | **Saint-Denis** (La Réunion) | `https://www.reunion.gouv.fr/booking/create` | ANTS |
| 101 | **976** | **Mamoudzou** (Mayotte) | `https://www.mayotte.gouv.fr/booking/create` | ANTS |

---

## HOW TO FIND THE REAL BOOKING URLS

> ⚠️ **IMPORTANT:** The URLs above use the ANTS `/booking/create` pattern. However, many prefectures have **redirected** their booking to different platforms or subpaths. The REAL URLs must be verified manually.

### Step-by-step process to find each real URL:

```
For each prefecture:

1. Go to https://www.{department-name}.gouv.fr
2. Search for "rendez-vous" or "prendre rendez-vous" or "titre de séjour"
3. Find the booking link — it may redirect to:
   a. /booking/create (ANTS system — easiest)
   b. An external platform (Doctolib, etc.)
   c. A form or PDF (some small prefectures — can't scrape)
4. Note the final URL after all redirects
5. Open Chrome DevTools (F12) → inspect the DOM
6. Identify selectors for:
   - Procedure dropdown
   - Available slots
   - "No slots" message
   - Date/time details
7. Save as a config object
```

### Alternative: Use the centralized ANTS platform

Many prefectures now use a **single centralized platform**:

```
https://rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/{CODE}/
```

Where `{CODE}` varies by prefecture and procedure. Check if your target prefecture is listed here — if so, you only need ONE scraper for all of them.

---

## SCRAPER CONFIG TEMPLATE

Use this template for each prefecture:

```typescript
{
  id: "paris_75",
  name: "Paris",
  department: "75",
  region: "Île-de-France",
  tier: 1,
  
  // The ACTUAL booking URL (verify manually!)
  bookingUrl: "https://www.prefecturedepolice.interieur.gouv.fr/demarches/rendez-vous",
  bookingSystem: "custom",  // "ants" | "custom" | "prefenligne" | "doctolib"
  
  // CSS selectors (find via Chrome DevTools F12)
  selectors: {
    cookieAccept: "#cookie-accept",
    procedureDropdown: "select#procedure",
    procedureValue: "titre_sejour",
    nextButton: "button.btn-primary",
    availableSlot: ".slot-available, .creneau-libre",
    noSlotMessage: ".no-availability, .aucun-creneau",
    slotDate: ".slot-date",
    slotTime: ".slot-time",
    captchaDetect: "iframe[src*='recaptcha']",
  },
  
  procedures: [
    { value: "titre_sejour_premiere", label: "Titre de séjour - Première demande", type: "TITRE_SEJOUR" },
    { value: "titre_sejour_renouvellement", label: "Titre de séjour - Renouvellement", type: "TITRE_SEJOUR" },
    { value: "naturalisation", label: "Naturalisation", type: "NATURALISATION" },
  ],
  
  checkInterval: 30,  // seconds (Tier 1 = 30s)
}
```

---

## ANTI-DETECTION PER PREFECTURE

### Different prefectures have different protections:

| Protection | # Using It | How to Bypass |
|-----------|-----------|---------------|
| **No protection** | ~50 | Direct scraping, no tricks needed |
| **Rate limiting** (IP-based) | ~30 | Proxy rotation (French residential IPs) |
| **Cloudflare** | ~10 | Use `playwright-extra` + stealth, slow mode |
| **reCAPTCHA v2** | ~5 | Anti-captcha service ($2-3/1000 solves) |
| **reCAPTCHA v3** | ~3 | Stealth plugin usually scores >0.7, pass through |
| **Custom WAF** | ~3 | Session cookies, realistic headers |

### Proxy Providers (French Residential IPs)

| Provider | Price | French IPs | Best For |
|----------|-------|-----------|----------|
| **Bright Data** | $15/GB | ✅ Yes | Best quality, most expensive |
| **Oxylabs** | $12/GB | ✅ Yes | Good alternative |
| **SmartProxy** | $8/GB | ✅ Yes | Best value |
| **IPRoyal** | $5/GB | ✅ Yes | Budget option |

> 💡 **TIP:** For 101 prefectures checked every 30-120s, you'll use ~5-15 GB/month of proxy traffic = **$40-120/month**.

---

## IMPLEMENTATION ORDER

### Phase 1: Launch (Week 1-2)
Focus on **8 Île-de-France prefectures** only. They represent 80% of your customers.

```
Paris (75) → Bobigny (93) → Créteil (94) → Nanterre (92)  
→ Évry (91) → Cergy (95) → Melun (77) → Versailles (78)
```

1. Manually find the real booking URL for each
2. Identify CSS selectors via Chrome DevTools
3. Build scraper config
4. Test 100 times to ensure reliability
5. Launch with these 8 only

### Phase 2: Growth (Week 3-4)
Add **12 major cities** = 20 total prefectures.

```
Lyon → Marseille → Toulouse → Lille → Nantes → Bordeaux  
→ Montpellier → Strasbourg → Nice → Rouen → Rennes → Grenoble
```

### Phase 3: Scale (Month 2)
Add remaining 81 prefectures. Most use the same ANTS system, so one scraper handles all.

### Phase 4: Automation (Month 3+)
Build auto-detection: visit any prefecture URL, auto-identify booking system, auto-generate selectors.

---

## COMMON BOOKING PAGE PATTERNS

When inspecting prefecture sites with DevTools (F12), look for these common patterns:

### Pattern A: Calendar with clickable dates
```html
<!-- Available day has a specific class -->
<td class="day available" data-date="2026-03-15">15</td>
<td class="day unavailable" data-date="2026-03-16">16</td>

<!-- Selector: td.day.available -->
```

### Pattern B: List of time slots
```html
<div class="creneaux-list">
  <button class="creneau disponible">09:30</button>
  <button class="creneau indisponible" disabled>10:00</button>
</div>

<!-- Selector: button.creneau.disponible -->
```

### Pattern C: "No availability" message
```html
<div class="alert alert-warning">
  <p>Aucun créneau disponible pour le moment.</p>
</div>

<!-- Selector: .alert-warning, text contains "aucun créneau" -->
```

### Pattern D: Dropdown + Submit flow
```html
<form>
  <select id="demarche">
    <option value="titre_sejour">Titre de séjour</option>
  </select>
  <button type="submit">Vérifier disponibilité</button>
</form>
<!-- After submit, new page loads with calendar -->
```

---

## IMPORTANT NOTES

1. **URLs WILL CHANGE** — Prefecture websites get redesigned. Build a health check that detects broken selectors and alerts you.

2. **Some prefectures DON'T have online booking** — A few small rural prefectures still do phone-only booking. Skip these.

3. **ANTS is your best friend** — The centralized `rdv-prefecture.interieur.gouv.fr` platform is used by the majority. If you crack this one system, you unlock ~40 prefectures instantly.

4. **Paris is SPECIAL** — Paris uses the Préfecture de Police (separate from ANTS). It's the hardest to scrape but has the highest demand. Focus maximum effort here.

5. **Test at 3am** — Most real slots appear between 1am-5am (batch system releases). Your scraper must be running 24/7.

6. **Screenshot EVERYTHING** — Save screenshots on every detection. This is your proof to users that the service works, and evidence for refund disputes.
