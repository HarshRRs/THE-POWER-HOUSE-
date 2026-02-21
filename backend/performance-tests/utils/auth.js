/**
 * Authentication utilities for k6 tests
 * Handles login, token management, and authenticated requests
 */

import http from 'k6/http';
import { check, fail } from 'k6';
import { BASE_URL, defaultOptions, testUsers } from '../config/test-config.js';

// Token storage per VU
const tokens = {};

/**
 * Login and get access token
 */
export function login(email, password) {
  const payload = JSON.stringify({ email, password });
  
  const res = http.post(`${BASE_URL}/api/auth/login`, payload, {
    headers: defaultOptions.headers,
    tags: { name: 'login' },
  });

  const success = check(res, {
    'login status is 200': (r) => r.status === 200,
    'login has access token': (r) => r.json('data.accessToken') !== undefined,
  });

  if (!success) {
    console.log(`Login failed: ${res.status} - ${res.body}`);
    return null;
  }

  const data = res.json('data');
  tokens[__VU] = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt: Date.now() + (14 * 60 * 1000), // 14 minutes
  };

  return tokens[__VU];
}

/**
 * Login with test user credentials
 */
export function loginTestUser(type = 'regular') {
  const user = testUsers[type];
  if (!user) {
    fail(`Unknown test user type: ${type}`);
  }
  return login(user.email, user.password);
}

/**
 * Get current access token, refreshing if needed
 */
export function getAccessToken() {
  const token = tokens[__VU];
  
  if (!token) {
    return loginTestUser().accessToken;
  }

  // Refresh if token expires in less than 2 minutes
  if (token.expiresAt - Date.now() < 120000) {
    refreshToken();
  }

  return tokens[__VU]?.accessToken;
}

/**
 * Refresh access token
 */
export function refreshToken() {
  const token = tokens[__VU];
  if (!token?.refreshToken) {
    return loginTestUser();
  }

  const res = http.post(`${BASE_URL}/api/auth/refresh`, null, {
    headers: {
      ...defaultOptions.headers,
      'Cookie': `refreshToken=${token.refreshToken}`,
    },
    tags: { name: 'refresh' },
  });

  const success = check(res, {
    'refresh status is 200': (r) => r.status === 200,
    'refresh has new access token': (r) => r.json('data.accessToken') !== undefined,
  });

  if (!success) {
    console.log(`Token refresh failed, re-logging in`);
    return loginTestUser();
  }

  const data = res.json('data');
  tokens[__VU] = {
    accessToken: data.accessToken,
    refreshToken: token.refreshToken,
    expiresAt: Date.now() + (14 * 60 * 1000),
  };

  return tokens[__VU];
}

/**
 * Get headers with authentication
 */
export function authHeaders() {
  const accessToken = getAccessToken();
  return {
    ...defaultOptions.headers,
    'Authorization': `Bearer ${accessToken}`,
  };
}

/**
 * Make authenticated GET request
 */
export function authGet(path, params = {}) {
  return http.get(`${BASE_URL}${path}`, {
    headers: authHeaders(),
    tags: params.tags || {},
  });
}

/**
 * Make authenticated POST request
 */
export function authPost(path, payload, params = {}) {
  return http.post(`${BASE_URL}${path}`, JSON.stringify(payload), {
    headers: authHeaders(),
    tags: params.tags || {},
  });
}

/**
 * Make authenticated PATCH request
 */
export function authPatch(path, payload, params = {}) {
  return http.patch(`${BASE_URL}${path}`, JSON.stringify(payload), {
    headers: authHeaders(),
    tags: params.tags || {},
  });
}

/**
 * Make authenticated DELETE request
 */
export function authDelete(path, params = {}) {
  return http.del(`${BASE_URL}${path}`, null, {
    headers: authHeaders(),
    tags: params.tags || {},
  });
}

/**
 * Register a new user
 */
export function register(email, password) {
  const payload = JSON.stringify({ email, password });
  
  const res = http.post(`${BASE_URL}/api/auth/register`, payload, {
    headers: defaultOptions.headers,
    tags: { name: 'register' },
  });

  check(res, {
    'register status is 201 or 409': (r) => r.status === 201 || r.status === 409,
  });

  return res;
}

/**
 * Logout current user
 */
export function logout() {
  const res = http.post(`${BASE_URL}/api/auth/logout`, null, {
    headers: authHeaders(),
    tags: { name: 'logout' },
  });

  tokens[__VU] = null;
  return res;
}
