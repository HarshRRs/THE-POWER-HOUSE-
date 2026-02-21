/**
 * Authentication Load Test
 * Tests login, register, token refresh under concurrent load
 * 
 * Run: k6 run scenarios/auth-load.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';
import { BASE_URL, defaultOptions, thresholds, vuProfiles } from '../config/test-config.js';
import { randomEmail, randomPassword, thinkTime } from '../utils/data-generators.js';

// Custom metrics
const loginDuration = new Trend('login_duration', true);
const registerDuration = new Trend('register_duration', true);
const refreshDuration = new Trend('refresh_duration', true);
const rateLimitHits = new Counter('rate_limit_hits');
const authErrors = new Rate('auth_errors');

// Test configuration
export const options = {
  scenarios: {
    // Scenario 1: Ramp up login load
    login_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },   // Ramp up to 50 users
        { duration: '3m', target: 50 },   // Stay at 50
        { duration: '1m', target: 100 },  // Ramp to 100
        { duration: '3m', target: 100 },  // Stay at 100
        { duration: '1m', target: 0 },    // Ramp down
      ],
      exec: 'loginScenario',
    },
    // Scenario 2: Registration burst
    register_burst: {
      executor: 'constant-arrival-rate',
      rate: 10,                           // 10 registrations per second
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 20,
      maxVUs: 50,
      exec: 'registerScenario',
      startTime: '2m',                    // Start after login ramp
    },
    // Scenario 3: Token refresh
    refresh_load: {
      executor: 'constant-vus',
      vus: 20,
      duration: '5m',
      exec: 'refreshScenario',
      startTime: '5m',
    },
  },
  thresholds: {
    'login_duration': ['p(95)<500', 'p(99)<1000'],
    'register_duration': ['p(95)<800', 'p(99)<1500'],
    'refresh_duration': ['p(95)<300', 'p(99)<500'],
    'auth_errors': ['rate<0.01'],         // Less than 1% errors
    'http_req_duration': ['p(95)<1000'],
    'http_req_failed': ['rate<0.05'],     // Allow some 429s from rate limiting
  },
};

// Setup: Create test users
export function setup() {
  console.log('Setting up auth load test...');
  
  // Create a pool of test users for login tests
  const testUsers = [];
  for (let i = 0; i < 100; i++) {
    const email = `loadtest_${i}_${Date.now()}@test.rdvpriority.fr`;
    const password = randomPassword();
    
    const res = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify({
      email,
      password,
    }), { headers: defaultOptions.headers });
    
    if (res.status === 201 || res.status === 409) {
      testUsers.push({ email, password });
    }
  }
  
  console.log(`Created ${testUsers.length} test users`);
  return { testUsers };
}

// Login scenario
export function loginScenario(data) {
  const testUsers = data.testUsers;
  if (!testUsers || testUsers.length === 0) {
    console.log('No test users available');
    return;
  }
  
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];
  
  group('Login Flow', () => {
    // Step 1: Login
    const loginStart = Date.now();
    const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
      email: user.email,
      password: user.password,
    }), {
      headers: defaultOptions.headers,
      tags: { name: 'POST /api/auth/login' },
    });
    loginDuration.add(Date.now() - loginStart);

    const loginSuccess = check(loginRes, {
      'login returns 200': (r) => r.status === 200,
      'login has accessToken': (r) => r.json('data.accessToken') !== undefined,
    });

    if (!loginSuccess) {
      authErrors.add(1);
      if (loginRes.status === 429) {
        rateLimitHits.add(1);
      }
      return;
    }
    authErrors.add(0);

    const accessToken = loginRes.json('data.accessToken');
    
    // Step 2: Access protected route
    sleep(thinkTime() / 1000);
    
    const meRes = http.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        ...defaultOptions.headers,
        'Authorization': `Bearer ${accessToken}`,
      },
      tags: { name: 'GET /api/auth/me' },
    });

    check(meRes, {
      'me returns 200': (r) => r.status === 200,
      'me has user data': (r) => r.json('data.email') !== undefined,
    });

    // Step 3: Logout
    sleep(thinkTime() / 1000);
    
    const logoutRes = http.post(`${BASE_URL}/api/auth/logout`, null, {
      headers: {
        ...defaultOptions.headers,
        'Authorization': `Bearer ${accessToken}`,
      },
      tags: { name: 'POST /api/auth/logout' },
    });

    check(logoutRes, {
      'logout returns 200': (r) => r.status === 200,
    });
  });

  sleep(1); // 1 second between iterations
}

// Registration scenario
export function registerScenario() {
  const email = randomEmail();
  const password = randomPassword();
  
  const startTime = Date.now();
  const res = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify({
    email,
    password,
  }), {
    headers: defaultOptions.headers,
    tags: { name: 'POST /api/auth/register' },
  });
  registerDuration.add(Date.now() - startTime);

  const success = check(res, {
    'register returns 201 or 409': (r) => r.status === 201 || r.status === 409,
  });

  if (!success) {
    authErrors.add(1);
    if (res.status === 429) {
      rateLimitHits.add(1);
    }
  } else {
    authErrors.add(0);
  }
}

// Token refresh scenario
export function refreshScenario(data) {
  const testUsers = data.testUsers;
  if (!testUsers || testUsers.length === 0) return;
  
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];
  
  // Login first
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), { headers: defaultOptions.headers });

  if (loginRes.status !== 200) return;

  const refreshToken = loginRes.cookies.refreshToken?.[0]?.value;
  if (!refreshToken) return;

  // Wait and refresh
  sleep(5);

  const startTime = Date.now();
  const refreshRes = http.post(`${BASE_URL}/api/auth/refresh`, null, {
    headers: defaultOptions.headers,
    cookies: { refreshToken },
    tags: { name: 'POST /api/auth/refresh' },
  });
  refreshDuration.add(Date.now() - startTime);

  const success = check(refreshRes, {
    'refresh returns 200': (r) => r.status === 200,
    'refresh has new accessToken': (r) => r.json('data.accessToken') !== undefined,
  });

  if (!success) {
    authErrors.add(1);
    if (refreshRes.status === 429) {
      rateLimitHits.add(1);
    }
  } else {
    authErrors.add(0);
  }

  sleep(10); // Longer wait between refresh cycles
}

// Teardown
export function teardown(data) {
  console.log('Auth load test complete');
  console.log(`Rate limit hits: ${rateLimitHits}`);
}
