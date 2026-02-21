/**
 * Metrics Collection Middleware
 * Collects HTTP request metrics in Prometheus format
 */

import type { Request, Response, NextFunction } from 'express';

// Metrics storage
interface RequestMetric {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  timestamp: number;
}

// Rolling window of recent requests (last 5 minutes)
const WINDOW_MS = 5 * 60 * 1000;
const requestMetrics: RequestMetric[] = [];

/**
 * Express middleware to collect request metrics
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Skip metrics endpoint to avoid recursion
  if (req.path === '/api/metrics' || req.path.startsWith('/api/metrics/')) {
    next();
    return;
  }

  // Capture response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Normalize path (replace IDs with :id)
    const normalizedPath = normalizePath(req.path);
    
    // Store metric
    requestMetrics.push({
      method: req.method,
      path: normalizedPath,
      statusCode: res.statusCode,
      duration,
      timestamp: Date.now(),
    });

    // Cleanup old metrics
    cleanupOldMetrics();
  });

  next();
}

/**
 * Normalize path by replacing UUIDs and numeric IDs with placeholders
 */
function normalizePath(path: string): string {
  return path
    // UUID pattern
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
    // Numeric IDs
    .replace(/\/\d+/g, '/:id')
    // Prefecture IDs like paris_75
    .replace(/\/[a-z]+_\d+[a-z]?/gi, '/:prefectureId');
}

/**
 * Remove metrics older than WINDOW_MS
 */
function cleanupOldMetrics(): void {
  const cutoff = Date.now() - WINDOW_MS;
  while (requestMetrics.length > 0 && requestMetrics[0].timestamp < cutoff) {
    requestMetrics.shift();
  }
}

/**
 * Get aggregated metrics
 */
export function getMetrics(): HttpMetrics {
  cleanupOldMetrics();

  const metrics: HttpMetrics = {
    totalRequests: requestMetrics.length,
    requestsByMethod: {},
    requestsByPath: {},
    requestsByStatus: {},
    latencyPercentiles: {},
    errorRate: 0,
  };

  if (requestMetrics.length === 0) {
    return metrics;
  }

  // Aggregate by method
  const methodCounts: Record<string, number> = {};
  const pathCounts: Record<string, { count: number; durations: number[] }> = {};
  const statusCounts: Record<string, number> = {};
  const allDurations: number[] = [];
  let errorCount = 0;

  for (const metric of requestMetrics) {
    // By method
    methodCounts[metric.method] = (methodCounts[metric.method] || 0) + 1;

    // By path
    const pathKey = `${metric.method} ${metric.path}`;
    if (!pathCounts[pathKey]) {
      pathCounts[pathKey] = { count: 0, durations: [] };
    }
    pathCounts[pathKey].count++;
    pathCounts[pathKey].durations.push(metric.duration);

    // By status
    const statusGroup = `${Math.floor(metric.statusCode / 100)}xx`;
    statusCounts[statusGroup] = (statusCounts[statusGroup] || 0) + 1;

    // Errors (4xx and 5xx)
    if (metric.statusCode >= 400) {
      errorCount++;
    }

    allDurations.push(metric.duration);
  }

  metrics.requestsByMethod = methodCounts;
  metrics.requestsByStatus = statusCounts;
  metrics.errorRate = errorCount / requestMetrics.length;

  // Calculate percentiles for all requests
  allDurations.sort((a, b) => a - b);
  metrics.latencyPercentiles = {
    p50: percentile(allDurations, 50),
    p90: percentile(allDurations, 90),
    p95: percentile(allDurations, 95),
    p99: percentile(allDurations, 99),
  };

  // Per-path metrics (top 20 by count)
  const sortedPaths = Object.entries(pathCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20);

  metrics.requestsByPath = {};
  for (const [path, data] of sortedPaths) {
    data.durations.sort((a, b) => a - b);
    metrics.requestsByPath[path] = {
      count: data.count,
      p50: percentile(data.durations, 50),
      p95: percentile(data.durations, 95),
      p99: percentile(data.durations, 99),
    };
  }

  return metrics;
}

/**
 * Get metrics in Prometheus text format
 */
export async function getMetricsText(): Promise<string> {
  const metrics = getMetrics();
  const lines: string[] = [];

  // Help and type definitions
  lines.push('# HELP http_requests_total Total HTTP requests');
  lines.push('# TYPE http_requests_total counter');
  lines.push(`http_requests_total ${metrics.totalRequests}`);

  lines.push('');
  lines.push('# HELP http_request_duration_seconds HTTP request latency');
  lines.push('# TYPE http_request_duration_seconds summary');
  lines.push(`http_request_duration_seconds{quantile="0.5"} ${(metrics.latencyPercentiles.p50 || 0) / 1000}`);
  lines.push(`http_request_duration_seconds{quantile="0.9"} ${(metrics.latencyPercentiles.p90 || 0) / 1000}`);
  lines.push(`http_request_duration_seconds{quantile="0.95"} ${(metrics.latencyPercentiles.p95 || 0) / 1000}`);
  lines.push(`http_request_duration_seconds{quantile="0.99"} ${(metrics.latencyPercentiles.p99 || 0) / 1000}`);

  lines.push('');
  lines.push('# HELP http_requests_by_method_total HTTP requests by method');
  lines.push('# TYPE http_requests_by_method_total counter');
  for (const [method, count] of Object.entries(metrics.requestsByMethod)) {
    lines.push(`http_requests_by_method_total{method="${method}"} ${count}`);
  }

  lines.push('');
  lines.push('# HELP http_requests_by_status_total HTTP requests by status');
  lines.push('# TYPE http_requests_by_status_total counter');
  for (const [status, count] of Object.entries(metrics.requestsByStatus)) {
    lines.push(`http_requests_by_status_total{status="${status}"} ${count}`);
  }

  lines.push('');
  lines.push('# HELP http_error_rate HTTP error rate (4xx + 5xx)');
  lines.push('# TYPE http_error_rate gauge');
  lines.push(`http_error_rate ${metrics.errorRate.toFixed(4)}`);

  lines.push('');
  lines.push('# HELP nodejs_memory_heap_used_bytes Node.js heap memory used');
  lines.push('# TYPE nodejs_memory_heap_used_bytes gauge');
  lines.push(`nodejs_memory_heap_used_bytes ${process.memoryUsage().heapUsed}`);

  lines.push('');
  lines.push('# HELP nodejs_memory_heap_total_bytes Node.js heap memory total');
  lines.push('# TYPE nodejs_memory_heap_total_bytes gauge');
  lines.push(`nodejs_memory_heap_total_bytes ${process.memoryUsage().heapTotal}`);

  lines.push('');
  lines.push('# HELP process_uptime_seconds Process uptime');
  lines.push('# TYPE process_uptime_seconds gauge');
  lines.push(`process_uptime_seconds ${process.uptime()}`);

  return lines.join('\n');
}

/**
 * Calculate percentile value
 */
function percentile(sortedArr: number[], p: number): number {
  if (sortedArr.length === 0) return 0;
  const index = Math.ceil((p / 100) * sortedArr.length) - 1;
  return sortedArr[Math.max(0, index)];
}

// Type definitions
interface HttpMetrics {
  totalRequests: number;
  requestsByMethod: Record<string, number>;
  requestsByPath: Record<string, { count: number; p50: number; p95: number; p99: number }>;
  requestsByStatus: Record<string, number>;
  latencyPercentiles: Record<string, number>;
  errorRate: number;
}
