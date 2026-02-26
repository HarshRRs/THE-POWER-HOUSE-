/**
 * Test Data Generators
 * Generate realistic test data for k6 load tests
 */

import { randomIntBetween, randomItem } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// French first names
const FIRST_NAMES = [
  'Jean', 'Pierre', 'Marie', 'Sophie', 'Thomas', 'Nicolas', 'Julie',
  'Antoine', 'Camille', 'Lucas', 'Emma', 'Hugo', 'Lea', 'Louis',
  'Chloe', 'Nathan', 'Manon', 'Gabriel', 'Sarah', 'Alexandre',
];

// French last names
const LAST_NAMES = [
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit',
  'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel',
  'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier',
];

// French cities
const CITIES = [
  'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg',
  'Montpellier', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Le Havre',
  'Saint-Etienne', 'Toulon', 'Grenoble', 'Dijon', 'Angers', 'Nimes',
];

// Procedures
const PROCEDURES = [
  'TITRE_SEJOUR',
  'NATURALISATION',
  'PERMIS_CONDUIRE',
  'CARTE_IDENTITE',
  'PASSEPORT',
];

// Prefecture IDs
const PREFECTURE_IDS = [
  'paris_75', 'bobigny_93', 'creteil_94', 'nanterre_92', 'evry_91',
  'cergy_95', 'melun_77', 'versailles_78', 'lyon_69', 'marseille_13',
  'toulouse_31', 'lille_59', 'nantes_44', 'bordeaux_33', 'montpellier_34',
  'strasbourg_67', 'nice_06', 'rouen_76', 'rennes_35', 'grenoble_38',
];

/**
 * Generate a random email address
 */
export function randomEmail() {
  const firstName = randomItem(FIRST_NAMES).toLowerCase();
  const lastName = randomItem(LAST_NAMES).toLowerCase();
  const num = randomIntBetween(1, 9999);
  const domains = ['gmail.com', 'yahoo.fr', 'hotmail.fr', 'outlook.com', 'free.fr'];
  return `${firstName}.${lastName}${num}@${randomItem(domains)}`;
}

/**
 * Generate a random password
 */
export function randomPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const specials = '!@#$%&*';
  // Guarantee at least one of each required category
  let password = '';
  password += upper.charAt(Math.floor(Math.random() * upper.length));
  password += lower.charAt(Math.floor(Math.random() * lower.length));
  password += digits.charAt(Math.floor(Math.random() * digits.length));
  password += specials.charAt(Math.floor(Math.random() * specials.length));
  // Fill remaining 8 chars from mixed set
  const all = upper + lower + digits + specials;
  for (let i = 0; i < 8; i++) {
    password += all.charAt(Math.floor(Math.random() * all.length));
  }
  return password;
}

/**
 * Generate a random French phone number
 */
export function randomPhone() {
  const prefixes = ['06', '07'];
  const prefix = randomItem(prefixes);
  let number = prefix;
  for (let i = 0; i < 8; i++) {
    number += Math.floor(Math.random() * 10);
  }
  return number;
}

/**
 * Generate a random procedure
 */
export function randomProcedure() {
  return randomItem(PROCEDURES);
}

/**
 * Generate a random prefecture ID
 */
export function randomPrefectureId() {
  return randomItem(PREFECTURE_IDS);
}

/**
 * Generate a random city
 */
export function randomCity() {
  return randomItem(CITIES);
}

/**
 * Generate alert creation payload
 */
export function randomAlertPayload() {
  return {
    prefectureId: randomPrefectureId(),
    procedure: randomProcedure(),
  };
}

/**
 * Generate user registration payload
 */
export function randomUserPayload() {
  return {
    email: randomEmail(),
    password: randomPassword(),
  };
}

/**
 * Generate user profile update payload
 */
export function randomProfileUpdate() {
  return {
    phone: Math.random() > 0.5 ? randomPhone() : undefined,
    notifyEmail: Math.random() > 0.3,
    notifyTelegram: Math.random() > 0.7,
    notifySms: Math.random() > 0.8,
  };
}

/**
 * Generate a batch of unique emails
 */
export function generateEmailBatch(count) {
  const emails = new Set();
  while (emails.size < count) {
    emails.add(randomEmail());
  }
  return Array.from(emails);
}

/**
 * Select random items from an array
 */
export function randomItems(arr, count) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, arr.length));
}

/**
 * Generate a weighted random selection
 */
export function weightedRandom(items, weights) {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }
  return items[items.length - 1];
}

/**
 * Generate realistic user behavior timing (milliseconds)
 */
export function thinkTime() {
  // Simulate user "thinking" between actions
  return randomIntBetween(1000, 5000);
}

/**
 * Generate page load simulation timing
 */
export function pageLoadTime() {
  return randomIntBetween(500, 2000);
}
