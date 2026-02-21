/**
 * WebSocket Load Test
 * Tests real-time notification delivery via Socket.io
 * 
 * Run: k6 run scenarios/websocket-load.js
 */

import { check, sleep } from 'k6';
import ws from 'k6/ws';
import http from 'k6/http';
import { Counter, Trend, Rate } from 'k6/metrics';
import { BASE_URL, WS_URL, defaultOptions } from '../config/test-config.js';

// Custom metrics
const wsConnectDuration = new Trend('ws_connect_duration', true);
const wsMsgLatency = new Trend('ws_msg_latency', true);
const wsConnections = new Counter('ws_connections');
const wsErrors = new Rate('ws_errors');
const wsDisconnects = new Counter('ws_disconnects');
const msgsReceived = new Counter('ws_msgs_received');

// Test configuration
export const options = {
  scenarios: {
    // Ramp up WebSocket connections
    ws_ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 },
        { duration: '3m', target: 200 },
        { duration: '2m', target: 500 },  // Target: 500 concurrent
        { duration: '3m', target: 500 },
        { duration: '1m', target: 0 },
      ],
      exec: 'wsConnection',
    },
  },
  thresholds: {
    'ws_connect_duration': ['p(95)<1000', 'p(99)<2000'],
    'ws_msg_latency': ['p(95)<500', 'p(99)<1000'],
    'ws_errors': ['rate<0.01'],
  },
};

// Test users pool
let testUsers = [];

// Setup: Create test users
export function setup() {
  console.log('Setting up WebSocket load test...');
  
  const users = [];
  for (let i = 0; i < 100; i++) {
    const email = `wstest_${i}_${Date.now()}@test.rdvpriority.fr`;
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
        userId: loginRes.json('data.user.id'),
        accessToken: loginRes.json('data.accessToken'),
      });
    }
  }
  
  console.log(`Created ${users.length} test users for WebSocket test`);
  return { users };
}

// WebSocket connection scenario
export function wsConnection(data) {
  const users = data.users;
  if (!users || users.length === 0) {
    console.log('No test users available');
    sleep(1);
    return;
  }
  
  const user = users[__VU % users.length];
  const wsUrl = `${WS_URL}/socket.io/?token=${user.accessToken}&EIO=4&transport=websocket`;
  
  const connectStart = Date.now();
  
  const res = ws.connect(wsUrl, {
    headers: {
      'Origin': BASE_URL,
    },
  }, function(socket) {
    wsConnections.add(1);
    wsConnectDuration.add(Date.now() - connectStart);
    
    let connected = false;
    let pingInterval = null;
    
    socket.on('open', () => {
      connected = true;
      
      // Socket.io handshake
      socket.send('40');  // Connect to default namespace
      
      // Keep-alive pings
      pingInterval = setInterval(() => {
        if (connected) {
          socket.send('2');  // Ping
        }
      }, 25000);
    });
    
    socket.on('message', (msg) => {
      msgsReceived.add(1);
      
      // Parse Socket.io message
      if (msg.startsWith('42')) {
        // Event message
        const msgTime = Date.now();
        try {
          const payload = JSON.parse(msg.slice(2));
          const eventName = payload[0];
          const eventData = payload[1];
          
          if (eventName === 'slot_detected' || eventName === 'notification') {
            // Measure latency if timestamp provided
            if (eventData && eventData.timestamp) {
              const latency = msgTime - new Date(eventData.timestamp).getTime();
              wsMsgLatency.add(latency);
            }
          }
        } catch (e) {
          // Not a JSON event
        }
      } else if (msg === '3') {
        // Pong response
      } else if (msg.startsWith('40')) {
        // Connected to namespace
        check(msg, {
          'connected to namespace': () => true,
        });
      }
    });
    
    socket.on('error', (e) => {
      wsErrors.add(1);
      console.log(`WebSocket error: ${e.message}`);
    });
    
    socket.on('close', () => {
      connected = false;
      wsDisconnects.add(1);
      if (pingInterval) {
        clearInterval(pingInterval);
      }
    });
    
    // Keep connection open for duration of test iteration
    socket.setTimeout(function() {
      socket.close();
    }, 60000);  // 60 second connection duration
  });
  
  check(res, {
    'WebSocket connected': (r) => r && r.status === 101,
  });
  
  if (!res || res.status !== 101) {
    wsErrors.add(1);
  } else {
    wsErrors.add(0);
  }
  
  sleep(1);
}

export function teardown(data) {
  console.log('\n========== WEBSOCKET PERFORMANCE SUMMARY ==========');
  console.log(`Total Connections: ${wsConnections.values?.count || 0}`);
  console.log(`Messages Received: ${msgsReceived.values?.count || 0}`);
  console.log(`Disconnects: ${wsDisconnects.values?.count || 0}`);
  console.log('====================================================\n');
}
