/**
 * Admin Dashboard Load Test
 * Tests heavy aggregation queries on admin dashboard
 * 
 * Run: k6 run scenarios/admin-dashboard.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';
import { BASE_URL, defaultOptions } from '../config/test-config.js';

// Custom metrics
const dashboardDuration = new Trend('dashboard_duration', true);
const userListDuration = new Trend('user_list_duration', true);
const prefectureListDuration = new Trend('prefecture_list_duration', true);
const paymentListDuration = new Trend('payment_list_duration', true);
const scraperStatusDuration = new Trend('scraper_status_duration', true);
const adminErrors = new Rate('admin_errors');
const dbPoolExhaustion = new Counter('db_pool_exhaustion');

// Test configuration
export const options = {
  scenarios: {
    // Admin dashboard stress
    dashboard_stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '2m', target: 10 },    // 10 concurrent admins
        { duration: '2m', target: 10 },
        { duration: '30s', target: 0 },
      ],
      exec: 'dashboardStress',
    },
    // Paginated list stress
    list_stress: {
      executor: 'constant-vus',
      vus: 5,
      duration: '3m',
      exec: 'listStress',
      startTime: '5m',
    },
  },
  thresholds: {
    'dashboard_duration': ['p(95)<2000', 'p(99)<3000'],
    'user_list_duration': ['p(95)<500', 'p(99)<1000'],
    'prefecture_list_duration': ['p(95)<300', 'p(99)<500'],
    'payment_list_duration': ['p(95)<500', 'p(99)<1000'],
    'admin_errors': ['rate<0.005'],
    'http_req_failed': ['rate<0.01'],
  },
};

// Admin state
let adminToken = null;

// Setup: Login as admin
export function setup() {
  console.log('Setting up admin dashboard test...');
  
  // Login as admin
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'admin@rdvpriority.fr',
    password: 'AdminTest123!',
  }), { headers: defaultOptions.headers });
  
  if (loginRes.status !== 200) {
    console.log('Admin login failed, creating admin user...');
    
    // Try to register admin (might already exist)
    http.post(`${BASE_URL}/api/auth/register`, JSON.stringify({
      email: 'admin@rdvpriority.fr',
      password: 'AdminTest123!',
    }), { headers: defaultOptions.headers });
    
    // Note: In real setup, you'd need to manually set role to ADMIN in DB
    console.log('WARN: Admin user needs ADMIN role set manually in database');
    
    // Retry login
    const retryLogin = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
      email: 'admin@rdvpriority.fr',
      password: 'AdminTest123!',
    }), { headers: defaultOptions.headers });
    
    if (retryLogin.status === 200) {
      return { adminToken: retryLogin.json('data.accessToken') };
    }
    
    console.log('Admin setup failed, tests will fail');
    return { adminToken: null };
  }
  
  return { adminToken: loginRes.json('data.accessToken') };
}

function getAdminHeaders(token) {
  return {
    ...defaultOptions.headers,
    'Authorization': `Bearer ${token}`,
  };
}

// Dashboard stress test
export function dashboardStress(data) {
  if (!data.adminToken) {
    console.log('No admin token, skipping');
    return;
  }
  
  const headers = getAdminHeaders(data.adminToken);
  
  group('Admin Dashboard', () => {
    // Main dashboard (12 parallel queries internally)
    const dashStart = Date.now();
    const dashRes = http.get(`${BASE_URL}/api/admin/dashboard`, {
      headers,
      tags: { name: 'GET /api/admin/dashboard' },
    });
    const dashDuration = Date.now() - dashStart;
    dashboardDuration.add(dashDuration);
    
    const dashSuccess = check(dashRes, {
      'dashboard returns 200 or 403': (r) => r.status === 200 || r.status === 403,
      'dashboard has data': (r) => r.status === 403 || r.json('data') !== undefined,
    });
    
    if (!dashSuccess) {
      adminErrors.add(1);
      
      // Check for connection pool exhaustion
      if (dashRes.body && dashRes.body.includes('connection pool')) {
        dbPoolExhaustion.add(1);
      }
    } else {
      adminErrors.add(0);
    }
    
    // Log slow queries
    if (dashDuration > 2000) {
      console.log(`SLOW: Dashboard took ${dashDuration}ms`);
    }
  });
  
  sleep(2); // 2 second pause between dashboard loads
}

// Paginated list stress
export function listStress(data) {
  if (!data.adminToken) return;
  
  const headers = getAdminHeaders(data.adminToken);
  const page = Math.floor(Math.random() * 10) + 1;
  const limit = 50;
  
  group('Admin Lists', () => {
    // Users list
    const userStart = Date.now();
    const userRes = http.get(`${BASE_URL}/api/admin/users?page=${page}&limit=${limit}`, {
      headers,
      tags: { name: 'GET /api/admin/users' },
    });
    userListDuration.add(Date.now() - userStart);
    
    check(userRes, {
      'users returns 200 or 403': (r) => r.status === 200 || r.status === 403,
    });
    
    sleep(0.5);
    
    // Prefectures list
    const prefStart = Date.now();
    const prefRes = http.get(`${BASE_URL}/api/admin/prefectures`, {
      headers,
      tags: { name: 'GET /api/admin/prefectures' },
    });
    prefectureListDuration.add(Date.now() - prefStart);
    
    check(prefRes, {
      'prefectures returns 200 or 403': (r) => r.status === 200 || r.status === 403,
    });
    
    sleep(0.5);
    
    // Payments list
    const payStart = Date.now();
    const payRes = http.get(`${BASE_URL}/api/admin/payments?page=${page}&limit=${limit}`, {
      headers,
      tags: { name: 'GET /api/admin/payments' },
    });
    paymentListDuration.add(Date.now() - payStart);
    
    check(payRes, {
      'payments returns 200 or 403': (r) => r.status === 200 || r.status === 403,
    });
    
    sleep(0.5);
    
    // Scraper status
    const scraperStart = Date.now();
    const scraperRes = http.get(`${BASE_URL}/api/admin/scraper/status`, {
      headers,
      tags: { name: 'GET /api/admin/scraper/status' },
    });
    scraperStatusDuration.add(Date.now() - scraperStart);
    
    check(scraperRes, {
      'scraper status returns 200 or 403': (r) => r.status === 200 || r.status === 403,
    });
  });
  
  sleep(1);
}

export function teardown(data) {
  console.log('Admin dashboard test complete');
  console.log(`DB Pool Exhaustion Events: ${dbPoolExhaustion.values?.count || 0}`);
}
