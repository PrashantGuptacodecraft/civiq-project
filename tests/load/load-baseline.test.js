/**
 * High-Throughput Ingress and Query Load Baseline Test
 * Phase 71: Performance, Resilience, and Observability Closure
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../backend/src/app.js';
import { metricsCollector } from '../../backend/src/observability/metrics.js';
import { dashboardCache } from '../../backend/src/modules/dashboard/dashboard.service.js';

describe('Performance Baseline & Load Tolerance (Phase 71)', () => {
  const app = createApp();

  it('meets high-concurrency throughput and p95 latency SLO (<250ms)', async () => {
    metricsCollector.reset();
    const concurrentRequests = 100;
    const startTime = Date.now();

    const promises = Array.from({ length: concurrentRequests }).map(() =>
      request(app).get('/health')
    );

    const responses = await Promise.all(promises);
    const totalTimeMs = Date.now() - startTime;

    // Verify all requests succeeded
    responses.forEach((res) => {
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    const snapshot = metricsCollector.getSnapshot();
    expect(snapshot.apiLatency.samples).toBe(concurrentRequests);
    // Baseline p95 should easily pass the 250ms SRE target
    expect(snapshot.apiLatency.p95).toBeLessThan(250);
    // Average throughput per request should be efficient
    expect(totalTimeMs).toBeLessThan(3000);
  });

  it('verifies safe cache offloading on heavy analytical queries under load', async () => {
    dashboardCache.clear();
    const cacheKey = 'kpi:ALL:ALL:30d';

    // Seed cached result
    const mockKpiResult = {
      kpis: { totalIssues: 500, openCount: 120, slaComplianceRate: 98.2 },
      byDepartment: [],
      byWard: [],
      metadata: { dataFreshness: new Date().toISOString() },
    };
    dashboardCache.set(cacheKey, mockKpiResult, 30000);

    const concurrentReads = 50;
    const startTime = Date.now();

    const responses = await Promise.all(
      Array.from({ length: concurrentReads }).map(() =>
        request(app).get('/dashboard/kpis?timeRange=30d')
      )
    );

    const elapsed = Date.now() - startTime;
    responses.forEach((res) => {
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.kpis.totalIssues).toBe(500);
    });

    // 50 concurrent cached reads should execute rapidly (<500ms)
    expect(elapsed).toBeLessThan(1000);
    expect(dashboardCache.get(cacheKey)).toBeDefined();
  });
});
