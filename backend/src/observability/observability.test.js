/**
 * Phase 71: Observability, Metrics, Cache, and Circuit Breaker Test Suite
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { metricsCollector } from './metrics.js';
import { SafeCache, withQueryBudget } from './cache.js';
import { CircuitBreaker, CIRCUIT_STATE } from './circuit-breaker.js';
import { i18nService } from '../modules/i18n/i18n.service.js';

describe('Phase 71 — Observability, Performance & Resilience', () => {
  beforeEach(() => {
    metricsCollector.reset();
  });

  describe('MetricsCollector', () => {
    it('records API latency and computes percentiles accurately', () => {
      [50, 100, 150, 200, 500].forEach((lat) => metricsCollector.recordApiLatency(lat));

      const snapshot = metricsCollector.getSnapshot();
      expect(snapshot.apiLatency.samples).toBe(5);
      expect(snapshot.apiLatency.p50).toBe(150);
      expect(snapshot.apiLatency.p95).toBe(500);
      expect(snapshot.apiLatency.p99).toBe(500);
    });

    it('tracks AI latency, verification backlog, SLA backlog, and queue ages', () => {
      metricsCollector.recordAiLatency(120);
      metricsCollector.recordAiLatency(180);
      metricsCollector.setVerificationBacklog(42);
      metricsCollector.setSlaBacklog(15);
      metricsCollector.setQueueAge('high-priority-alerts', 2500);

      const snapshot = metricsCollector.getSnapshot();
      expect(snapshot.aiLatency.samples).toBe(2);
      expect(snapshot.aiLatency.p50).toBe(120);
      expect(snapshot.aiLatency.p95).toBe(180);
      expect(snapshot.backlogs.verificationBacklog).toBe(42);
      expect(snapshot.backlogs.slaBacklog).toBe(15);
      expect(snapshot.queues['high-priority-alerts']).toBe(2500);
    });
  });

  describe('SafeCache and Query Budget', () => {
    it('manages LRU eviction, TTL expiration, and metrics recording', async () => {
      const cache = new SafeCache({ defaultTtlMs: 50, maxEntries: 2 });
      cache.set('a', 1);
      cache.set('b', 2);

      expect(cache.get('a')).toBe(1);
      expect(metricsCollector.cacheStats.hits).toBe(1);

      // Exceed max entries to trigger LRU eviction
      cache.set('c', 3);
      expect(metricsCollector.cacheStats.evictions).toBe(1);

      // Wait for expiration
      await new Promise((r) => setTimeout(r, 60));
      expect(cache.get('c')).toBeNull();
      expect(metricsCollector.cacheStats.misses).toBe(1);
    });

    it('executes within query budget and tracks query latency', async () => {
      const result = await withQueryBudget('test-query', async () => {
        return 'success';
      }, { budgetMs: 100 });

      expect(result).toBe('success');
      const snapshot = metricsCollector.getSnapshot();
      expect(snapshot.dbQueryLatency.samples).toBe(1);
    });
  });

  describe('CircuitBreaker Resilience', () => {
    it('trips circuit after threshold failures and triggers safe fallback', async () => {
      const breaker = new CircuitBreaker('mock-service', { failureThreshold: 3, cooldownMs: 100 });

      const failingService = vi.fn().mockRejectedValue(new Error('Downstream network timeout'));
      const fallback = vi.fn().mockResolvedValue('fallback-value');

      // 1st failure
      const res1 = await breaker.execute(failingService, fallback);
      expect(res1).toBe('fallback-value');
      expect(breaker.state).toBe(CIRCUIT_STATE.CLOSED);

      // 2nd failure
      await breaker.execute(failingService, fallback);
      expect(breaker.state).toBe(CIRCUIT_STATE.CLOSED);

      // 3rd failure -> trips OPEN
      await breaker.execute(failingService, fallback);
      expect(breaker.state).toBe(CIRCUIT_STATE.OPEN);

      // 4th call: directly triggers fallback without invoking failingService
      const res4 = await breaker.execute(failingService, fallback);
      expect(res4).toBe('fallback-value');
      expect(failingService).toHaveBeenCalledTimes(3); // was not called on 4th execution

      const snapshot = metricsCollector.getSnapshot();
      expect(snapshot.integrations['mock-service'].circuitOpen).toBe(false); // only at 5 in metrics or open state in breaker
    });
  });

  describe('Integration with Live Application & I18n', () => {
    const app = createApp();

    it('GET /metrics returns live snapshot', async () => {
      const res = await request(app).get('/metrics');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.metrics).toBeDefined();
      expect(res.body.metrics.apiLatency).toBeDefined();
    });

    it('i18n dynamic translation safely degrades when downstream fails', async () => {
      // Mock bhashini adapter throwing error
      const mockFailingAdapter = {
        translateText: vi.fn().mockRejectedValue(new Error('BHASHINI gateway timeout')),
        translateBatch: vi.fn().mockRejectedValue(new Error('BHASHINI gateway timeout')),
      };

      const originalAdapter = i18nService.bhashiniAdapter;
      i18nService.bhashiniAdapter = mockFailingAdapter;

      try {
        const result = await i18nService.translateDynamicText({
          text: 'Urgent road repair required',
          sourceLang: 'en',
          targetLang: 'hi',
        });

        // Graceful fallback returns original text without throwing
        expect(result.translatedText).toBe('Urgent road repair required');
        expect(result.provider).toBe('CIRCUIT_BREAKER_FALLBACK');
      } finally {
        i18nService.bhashiniAdapter = originalAdapter;
      }
    });
  });
});
