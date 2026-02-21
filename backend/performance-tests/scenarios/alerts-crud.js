/**
 * Alerts CRUD Load Test
 * Tests alert creation, listing, updating, and deletion under load
 * 
 * Run: k6 run scenarios/alerts-crud.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';
import { BASE_URL, defaultOptions, testUsers } from '../config/test-config.js';
import { randomAlertPayload, thinkTime } from '../utils/data-generators.js';

// Custom metrics
const alertCreateDuration = new Trend('alert_create_duration', true);
const alertListDuration = new Trend('alert_list_duration', true);
const alertToggleDuration = new Trend('alert_toggle_duration', true);
const alertDeleteDuration = new Trend('alert_delete_duration', true);
const alertErrors = new Rate('alert_errors');
const rateLimitHits = new Counter('rate_limit_hits');

// Test configuration
export const options = {
  scenarios: {
    // Main CRUD workflow
    crud_workflow: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 25 },   // Ramp up
        { duration: '5m', target: 50 },   // Steady state
        { duration: '2m', target: 50 },   // Hold
        { duration: '1m', target: 0 },    // Ramp down
      ],
      exec: 'crudWorkflow',
    },
    // Stress test listing with many alerts
    list_stress: {
      executor: 'constant-vus',
      vus: 10,
      duration: '3m',
      exec: 'listStress',
      startTime: '3m',
    },
  },
  thresholds: {
    'alert_create_duration': ['p(95)<300', 'p(99)<800'],
    'alert_list_duration': ['p(95)<200', 'p(99)<500'],
    'alert_toggle_duration': ['p(95)<200', 'p(99)<500'],
    'alert_delete_duration': ['p(95)<200', 'p(99)<500'],
    'alert_errors': ['rate<0.005'],
    'http_req_failed': ['rate<0.01'],
  },
};

// Shared state per VU
const vuState = {};

function getAuthHeaders(accessToken) {
  return {
    ...defaultOptions.headers,
    'Authorization': `Bearer ${accessToken}`,
  };
}

// Setup: Login test users
export function setup() {
  console.log('Setting up alerts CRUD test...');
  
  // Create test users with plans
  const users = [];
  for (let i = 0; i < 50; i++) {
    const email = `alerttest_${i}_${Date.now()}@test.rdvpriority.fr`;
    const password = 'TestPassword123!';
    
    // Register
    const regRes = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify({
      email,
      password,
    }), { headers: defaultOptions.headers });
    
    if (regRes.status !== 201) continue;
    
    // Login
    const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
      email,
      password,
    }), { headers: defaultOptions.headers });
    
    if (loginRes.status === 200) {
      users.push({
        email,
        password,
        accessToken: loginRes.json('data.accessToken'),
      });
    }
  }
  
  console.log(`Created ${users.length} test users for alerts test`);
  return { users };
}

// Main CRUD workflow
export function crudWorkflow(data) {
  const users = data.users;
  if (!users || users.length === 0) {
    console.log('No test users available');
    return;
  }
  
  const user = users[__VU % users.length];
  const headers = getAuthHeaders(user.accessToken);
  
  group('Alert CRUD Workflow', () => {
    // Step 1: List existing alerts
    const listStart = Date.now();
    const listRes = http.get(`${BASE_URL}/api/alerts`, {
      headers,
      tags: { name: 'GET /api/alerts' },
    });
    alertListDuration.add(Date.now() - listStart);
    
    const listSuccess = check(listRes, {
      'list returns 200': (r) => r.status === 200,
      'list returns array': (r) => Array.isArray(r.json('data')),
    });
    
    if (!listSuccess) {
      alertErrors.add(1);
      if (listRes.status === 429) rateLimitHits.add(1);
      return;
    }
    alertErrors.add(0);
    
    const existingAlerts = listRes.json('data') || [];
    
    // Step 2: Create new alert (if under limit)
    sleep(thinkTime() / 1000);
    
    if (existingAlerts.length < 5) {
      const createStart = Date.now();
      const createRes = http.post(`${BASE_URL}/api/alerts`, JSON.stringify(randomAlertPayload()), {
        headers,
        tags: { name: 'POST /api/alerts' },
      });
      alertCreateDuration.add(Date.now() - createStart);
      
      const createSuccess = check(createRes, {
        'create returns 201 or 409': (r) => r.status === 201 || r.status === 409 || r.status === 403,
      });
      
      if (!createSuccess) {
        alertErrors.add(1);
        if (createRes.status === 429) rateLimitHits.add(1);
      } else {
        alertErrors.add(0);
      }
    }
    
    // Step 3: Toggle an alert if exists
    sleep(thinkTime() / 1000);
    
    if (existingAlerts.length > 0) {
      const alertToToggle = existingAlerts[Math.floor(Math.random() * existingAlerts.length)];
      
      const toggleStart = Date.now();
      const toggleRes = http.patch(`${BASE_URL}/api/alerts/${alertToToggle.id}/toggle`, null, {
        headers,
        tags: { name: 'PATCH /api/alerts/:id/toggle' },
      });
      alertToggleDuration.add(Date.now() - toggleStart);
      
      const toggleSuccess = check(toggleRes, {
        'toggle returns 200': (r) => r.status === 200,
      });
      
      if (!toggleSuccess) {
        alertErrors.add(1);
        if (toggleRes.status === 429) rateLimitHits.add(1);
      } else {
        alertErrors.add(0);
      }
    }
    
    // Step 4: Delete oldest alert if > 3
    sleep(thinkTime() / 1000);
    
    if (existingAlerts.length > 3) {
      const alertToDelete = existingAlerts[existingAlerts.length - 1];
      
      const deleteStart = Date.now();
      const deleteRes = http.del(`${BASE_URL}/api/alerts/${alertToDelete.id}`, null, {
        headers,
        tags: { name: 'DELETE /api/alerts/:id' },
      });
      alertDeleteDuration.add(Date.now() - deleteStart);
      
      const deleteSuccess = check(deleteRes, {
        'delete returns 200': (r) => r.status === 200,
      });
      
      if (!deleteSuccess) {
        alertErrors.add(1);
        if (deleteRes.status === 429) rateLimitHits.add(1);
      } else {
        alertErrors.add(0);
      }
    }
  });
  
  sleep(2); // Pause between iterations
}

// List stress test
export function listStress(data) {
  const users = data.users;
  if (!users || users.length === 0) return;
  
  const user = users[__VU % users.length];
  const headers = getAuthHeaders(user.accessToken);
  
  // Rapidly list alerts
  const listStart = Date.now();
  const res = http.get(`${BASE_URL}/api/alerts`, {
    headers,
    tags: { name: 'GET /api/alerts (stress)' },
  });
  alertListDuration.add(Date.now() - listStart);
  
  check(res, {
    'list returns 200': (r) => r.status === 200,
  });
  
  if (res.status === 429) {
    rateLimitHits.add(1);
  }
  
  sleep(0.5); // Rapid requests
}

export function teardown(data) {
  console.log('Alerts CRUD test complete');
}
