/**
 * Performance Test Configuration
 * Centralized settings for all k6 test scenarios
 */

// Environment configuration
export const ENV = {
  local: {
    baseUrl: 'http://localhost:4000',
    wsUrl: 'ws://localhost:4000',
  },
  staging: {
    baseUrl: __ENV.STAGING_URL || 'https://staging-api.rdvpriority.fr',
    wsUrl: __ENV.STAGING_WS_URL || 'wss://staging-api.rdvpriority.fr',
  },
  production: {
    baseUrl: __ENV.PROD_URL || 'https://api.rdvpriority.fr',
    wsUrl: __ENV.PROD_WS_URL || 'wss://api.rdvpriority.fr',
  },
};

// Get current environment
export const currentEnv = __ENV.TEST_ENV || 'local';
export const BASE_URL = ENV[currentEnv].baseUrl;
export const WS_URL = ENV[currentEnv].wsUrl;

// Default HTTP request options
export const defaultOptions = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: '30s',
};

// Performance thresholds (SLOs)
export const thresholds = {
  // Auth endpoints
  auth: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
  // Alert CRUD endpoints
  alerts: {
    http_req_duration: ['p(95)<300', 'p(99)<800'],
    http_req_failed: ['rate<0.005'],
  },
  // Prefecture endpoints (cached)
  prefectures: {
    http_req_duration: ['p(95)<100', 'p(99)<200'],
    http_req_failed: ['rate<0.001'],
  },
  // Admin dashboard
  admin: {
    http_req_duration: ['p(95)<2000', 'p(99)<3000'],
    http_req_failed: ['rate<0.005'],
  },
  // WebSocket
  websocket: {
    ws_connecting: ['p(95)<1000'],
    ws_msgs_received: ['count>0'],
  },
};

// Virtual User profiles
export const vuProfiles = {
  smoke: {
    vus: 5,
    duration: '1m',
  },
  load: {
    stages: [
      { duration: '2m', target: 50 },   // Ramp up
      { duration: '5m', target: 50 },   // Steady state
      { duration: '2m', target: 100 },  // Peak
      { duration: '5m', target: 100 },  // Sustained peak
      { duration: '2m', target: 0 },    // Ramp down
    ],
  },
  stress: {
    stages: [
      { duration: '2m', target: 50 },
      { duration: '5m', target: 100 },
      { duration: '5m', target: 200 },
      { duration: '5m', target: 300 },
      { duration: '2m', target: 0 },
    ],
  },
  spike: {
    stages: [
      { duration: '1m', target: 10 },
      { duration: '30s', target: 500 },  // Spike!
      { duration: '1m', target: 500 },
      { duration: '30s', target: 10 },
      { duration: '2m', target: 0 },
    ],
  },
  soak: {
    stages: [
      { duration: '5m', target: 100 },
      { duration: '4h', target: 100 },   // Long duration
      { duration: '5m', target: 0 },
    ],
  },
};

// Test user credentials (for local/staging only)
export const testUsers = {
  regular: {
    email: 'loadtest@rdvpriority.fr',
    password: 'LoadTest123!',
  },
  admin: {
    email: 'admin@rdvpriority.fr',
    password: 'AdminTest123!',
  },
};

// Prefecture IDs for testing
export const testPrefectures = [
  'paris_75',
  'lyon_69',
  'marseille_13',
  'toulouse_31',
  'lille_59',
];

// Rate limiting configuration (for validation)
export const rateLimits = {
  auth: { max: 5, windowMs: 60000 },
  alerts: { max: 50, windowMs: 60000 },
  general: { max: 1000, windowMs: 900000 },
};
