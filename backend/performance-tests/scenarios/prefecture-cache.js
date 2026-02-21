/**
 * Prefecture Cache Load Test
 * Tests public prefecture endpoints and validates cache behavior
 * 
 * Run: k6 run scenarios/prefecture-cache.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';
import { BASE_URL, defaultOptions, testPrefectures } from '../config/test-config.js';

// Custom metrics
const prefListDuration = new Trend('pref_list_duration', true);
const prefDetailDuration = new Trend('pref_detail_duration', true);
const prefDetectionsDuration = new Trend('pref_detections_duration', true);
const cacheHits = new Counter('cache_hits');
const cacheMisses = new Counter('cache_misses');
const prefErrors = new Rate('pref_errors');

// Test configuration
export const options = {
  scenarios: {
    // High volume public traffic
    public_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '2m', target: 200 },   // High load
        { duration: '2m', target: 200 },
        { duration: '30s', target: 0 },
      ],
      exec: 'publicTraffic',
    },
    // Cache warmup test
    cache_test: {
      executor: 'per-vu-iterations',
      vus: 5,
      iterations: 20,
      exec: 'cacheTest',
      startTime: '5m',
    },
  },
  thresholds: {
    'pref_list_duration': ['p(95)<100', 'p(99)<200'],
    'pref_detail_duration': ['p(95)<100', 'p(99)<200'],
    'pref_detections_duration': ['p(95)<150', 'p(99)<300'],
    'pref_errors': ['rate<0.001'],
    'http_req_failed': ['rate<0.001'],
  },
};

// Public traffic simulation
export function publicTraffic() {
  const action = Math.random();
  
  if (action < 0.6) {
    // 60%: List all prefectures
    listPrefectures();
  } else if (action < 0.9) {
    // 30%: Get prefecture detail
    getPrefectureDetail();
  } else {
    // 10%: Get recent detections
    getPrefectureDetections();
  }
  
  sleep(Math.random() * 2); // 0-2 second think time
}

// List all prefectures
function listPrefectures() {
  const start = Date.now();
  const res = http.get(`${BASE_URL}/api/prefectures`, {
    headers: defaultOptions.headers,
    tags: { name: 'GET /api/prefectures' },
  });
  const duration = Date.now() - start;
  prefListDuration.add(duration);
  
  const success = check(res, {
    'list returns 200': (r) => r.status === 200,
    'list returns array': (r) => Array.isArray(r.json('data')),
    'list has prefectures': (r) => (r.json('data') || []).length > 0,
  });
  
  if (!success) {
    prefErrors.add(1);
  } else {
    prefErrors.add(0);
    
    // Estimate cache hit based on response time
    // Cached responses should be <50ms, uncached ~200-500ms
    if (duration < 50) {
      cacheHits.add(1);
    } else {
      cacheMisses.add(1);
    }
  }
  
  return res;
}

// Get specific prefecture
function getPrefectureDetail() {
  const prefId = testPrefectures[Math.floor(Math.random() * testPrefectures.length)];
  
  const start = Date.now();
  const res = http.get(`${BASE_URL}/api/prefectures/${prefId}`, {
    headers: defaultOptions.headers,
    tags: { name: 'GET /api/prefectures/:id' },
  });
  const duration = Date.now() - start;
  prefDetailDuration.add(duration);
  
  const success = check(res, {
    'detail returns 200 or 404': (r) => r.status === 200 || r.status === 404,
  });
  
  if (!success || res.status === 404) {
    prefErrors.add(res.status === 404 ? 0 : 1);
  } else {
    prefErrors.add(0);
    
    // Cache hit estimation
    if (duration < 50) {
      cacheHits.add(1);
    } else {
      cacheMisses.add(1);
    }
  }
  
  return res;
}

// Get prefecture detections
function getPrefectureDetections() {
  const prefId = testPrefectures[Math.floor(Math.random() * testPrefectures.length)];
  
  const start = Date.now();
  const res = http.get(`${BASE_URL}/api/prefectures/${prefId}/detections`, {
    headers: defaultOptions.headers,
    tags: { name: 'GET /api/prefectures/:id/detections' },
  });
  prefDetectionsDuration.add(Date.now() - start);
  
  const success = check(res, {
    'detections returns 200 or 404': (r) => r.status === 200 || r.status === 404,
  });
  
  if (!success) {
    prefErrors.add(1);
  } else {
    prefErrors.add(0);
  }
  
  return res;
}

// Cache effectiveness test
export function cacheTest() {
  group('Cache Effectiveness Test', () => {
    // First request (may be cold)
    const first = listPrefectures();
    const firstDuration = first.timings.duration;
    
    // Immediate second request (should be cached)
    const second = listPrefectures();
    const secondDuration = second.timings.duration;
    
    // Third request after small delay
    sleep(0.1);
    const third = listPrefectures();
    const thirdDuration = third.timings.duration;
    
    // Validate cache behavior
    check(null, {
      'subsequent requests faster': () => secondDuration <= firstDuration * 1.5,
      'cache remains warm': () => thirdDuration < 100,
    });
    
    console.log(`Cache test: 1st=${firstDuration}ms, 2nd=${secondDuration}ms, 3rd=${thirdDuration}ms`);
  });
  
  sleep(1);
}

// Summary
export function handleSummary(data) {
  const cacheHitRate = cacheHits.values.count / (cacheHits.values.count + cacheMisses.values.count) * 100;
  
  console.log('\n========== CACHE PERFORMANCE SUMMARY ==========');
  console.log(`Cache Hit Rate: ${cacheHitRate.toFixed(1)}% (target: >90%)`);
  console.log(`Total Requests: ${cacheHits.values.count + cacheMisses.values.count}`);
  console.log(`Cache Hits: ${cacheHits.values.count}`);
  console.log(`Cache Misses: ${cacheMisses.values.count}`);
  console.log('===============================================\n');
  
  return {
    'stdout': JSON.stringify(data, null, 2),
  };
}
