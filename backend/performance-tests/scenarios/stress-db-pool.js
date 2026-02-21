/**
 * Database Connection Pool Stress Test
 * Identifies breaking point of database connection pool
 * 
 * Run: k6 run scenarios/stress-db-pool.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Trend, Rate, Gauge } from 'k6/metrics';
import { BASE_URL, defaultOptions } from '../config/test-config.js';

// Custom metrics
const queryDuration = new Trend('query_duration', true);
const poolExhaustion = new Counter('pool_exhaustion_errors');
const timeoutErrors = new Counter('timeout_errors');
const connectionErrors = new Counter('connection_errors');
const concurrentQueries = new Gauge('concurrent_queries');
const errorRate = new Rate('error_rate');

// Test configuration
export const options = {
  scenarios: {
    // Gradually increase load until failure
    ramp_to_failure: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 20 },
        { duration: '1m', target: 30 },
        { duration: '1m', target: 40 },
        { duration: '1m', target: 50 },   // Likely starts failing here with pool=10
        { duration: '1m', target: 60 },
        { duration: '1m', target: 70 },
        { duration: '1m', target: 80 },
        { duration: '30s', target: 0 },
      ],
      exec: 'stressQueries',
    },
    // Spike test
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '10s', target: 100 },  // Sudden spike
        { duration: '1m', target: 100 },
        { duration: '30s', target: 10 },
        { duration: '30s', target: 0 },
      ],
      exec: 'stressQueries',
      startTime: '8m',
    },
  },
  thresholds: {
    'query_duration': ['p(99)<5000'],  // 5 second timeout
    'error_rate': ['rate<0.1'],        // Allow up to 10% errors (stress test)
  },
};

// State
let testToken = null;

// Setup
export function setup() {
  console.log('Setting up DB pool stress test...');
  console.log('WARNING: This test is designed to find breaking points');
  console.log('Expected behavior: errors will increase at high concurrency');
  
  // Create test user
  const email = `dbstress_${Date.now()}@test.rdvpriority.fr`;
  const password = 'TestPassword123!';
  
  http.post(`${BASE_URL}/api/auth/register`, JSON.stringify({
    email,
    password,
  }), { headers: defaultOptions.headers });
  
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email,
    password,
  }), { headers: defaultOptions.headers });
  
  if (loginRes.status === 200) {
    return { token: loginRes.json('data.accessToken') };
  }
  
  return { token: null };
}

// Main stress test
export function stressQueries(data) {
  concurrentQueries.add(1);
  
  group('Database Stress', () => {
    // Multiple queries in rapid succession
    const queries = [
      // Public queries (no auth)
      () => http.get(`${BASE_URL}/api/prefectures`, {
        headers: defaultOptions.headers,
        tags: { name: 'GET /api/prefectures' },
        timeout: '5s',
      }),
      () => http.get(`${BASE_URL}/api/prefectures/paris_75`, {
        headers: defaultOptions.headers,
        tags: { name: 'GET /api/prefectures/:id' },
        timeout: '5s',
      }),
      () => http.get(`${BASE_URL}/api/health`, {
        headers: defaultOptions.headers,
        tags: { name: 'GET /api/health' },
        timeout: '5s',
      }),
      () => http.get(`${BASE_URL}/api/health/stats`, {
        headers: defaultOptions.headers,
        tags: { name: 'GET /api/health/stats' },
        timeout: '5s',
      }),
    ];
    
    // Execute random query
    const queryFn = queries[Math.floor(Math.random() * queries.length)];
    
    const start = Date.now();
    let res;
    
    try {
      res = queryFn();
    } catch (e) {
      timeoutErrors.add(1);
      errorRate.add(1);
      console.log(`Query timeout: ${e.message}`);
      concurrentQueries.add(-1);
      return;
    }
    
    const duration = Date.now() - start;
    queryDuration.add(duration);
    
    // Check for various error conditions
    const success = check(res, {
      'response received': (r) => r !== null,
      'status ok': (r) => r && r.status >= 200 && r.status < 500,
    });
    
    if (!success) {
      errorRate.add(1);
      
      if (res && res.body) {
        const body = res.body.toLowerCase();
        
        if (body.includes('pool') || body.includes('connection')) {
          poolExhaustion.add(1);
          console.log(`Pool exhaustion detected at VU ${__VU}`);
        } else if (body.includes('timeout')) {
          timeoutErrors.add(1);
        } else if (body.includes('connect')) {
          connectionErrors.add(1);
        }
      }
    } else {
      errorRate.add(0);
    }
    
    // Log slow queries
    if (duration > 3000) {
      console.log(`SLOW QUERY: ${duration}ms at VU ${__VU}`);
    }
  });
  
  concurrentQueries.add(-1);
  
  // Minimal sleep to maximize pressure
  sleep(0.1);
}

export function teardown(data) {
  console.log('\n========== DB POOL STRESS TEST RESULTS ==========');
  console.log(`Pool Exhaustion Errors: ${poolExhaustion.values?.count || 0}`);
  console.log(`Timeout Errors: ${timeoutErrors.values?.count || 0}`);
  console.log(`Connection Errors: ${connectionErrors.values?.count || 0}`);
  console.log('================================================\n');
  
  if (poolExhaustion.values?.count > 0) {
    console.log('RECOMMENDATION: Increase DATABASE_POOL_SIZE');
  }
  
  if (timeoutErrors.values?.count > 0) {
    console.log('RECOMMENDATION: Optimize slow queries or increase pool_timeout');
  }
}
