/**
 * Performance, Resilience, and Observability Metrics System
 * Phase 71: Observability, Caching, Query Budgets & Resilience
 */

export class MetricsCollector {
  constructor() {
    this.reset();
  }

  reset() {
    this.apiLatencies = []; // array of duration ms
    this.aiLatencies = []; // array of duration ms
    this.dbQueryLatencies = []; // array of duration ms
    this.verificationBacklog = 0;
    this.slaBacklog = 0;
    this.queueAges = new Map(); // queueName -> ageMs
    this.externalFailures = new Map(); // integrationName -> { failures: number, lastError: string, circuitOpen: boolean }
    this.cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
  }

  // --- API & AI Latency Tracking ---
  recordApiLatency(durationMs) {
    if (typeof durationMs === 'number' && durationMs >= 0) {
      this.apiLatencies.push(durationMs);
      if (this.apiLatencies.length > 5000) {
        this.apiLatencies.shift();
      }
    }
  }

  recordAiLatency(durationMs) {
    if (typeof durationMs === 'number' && durationMs >= 0) {
      this.aiLatencies.push(durationMs);
      if (this.aiLatencies.length > 5000) {
        this.aiLatencies.shift();
      }
    }
  }

  recordDbQueryLatency(durationMs) {
    if (typeof durationMs === 'number' && durationMs >= 0) {
      this.dbQueryLatencies.push(durationMs);
      if (this.dbQueryLatencies.length > 5000) {
        this.dbQueryLatencies.shift();
      }
    }
  }

  // --- Backlog & Queue Tracking ---
  setVerificationBacklog(count) {
    this.verificationBacklog = Math.max(0, count);
  }

  setSlaBacklog(count) {
    this.slaBacklog = Math.max(0, count);
  }

  setQueueAge(queueName, ageMs) {
    this.queueAges.set(queueName, Math.max(0, ageMs));
  }

  // --- Cache Metrics ---
  recordCacheHit() {
    this.cacheStats.hits++;
  }

  recordCacheMiss() {
    this.cacheStats.misses++;
  }

  recordCacheEviction() {
    this.cacheStats.evictions++;
  }

  // --- External Integration Resilience Tracking ---
  recordIntegrationFailure(name, error, circuitOpen = undefined) {
    const current = this.externalFailures.get(name) || { failures: 0, lastError: null, circuitOpen: false };
    current.failures++;
    current.lastError = error ? String(error.message || error) : 'Unknown failure';
    if (circuitOpen !== undefined) {
      current.circuitOpen = Boolean(circuitOpen);
    } else if (current.failures >= 5) {
      current.circuitOpen = true;
    }
    this.externalFailures.set(name, current);
  }

  recordIntegrationSuccess(name) {
    const current = this.externalFailures.get(name);
    if (current) {
      current.failures = 0;
      current.circuitOpen = false;
      this.externalFailures.set(name, current);
    }
  }

  getPercentile(values, p) {
    if (!values || values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }

  getSnapshot() {
    const p50Api = this.getPercentile(this.apiLatencies, 50);
    const p95Api = this.getPercentile(this.apiLatencies, 95);
    const p99Api = this.getPercentile(this.apiLatencies, 99);

    const p50Ai = this.getPercentile(this.aiLatencies, 50);
    const p95Ai = this.getPercentile(this.aiLatencies, 95);
    const p99Ai = this.getPercentile(this.aiLatencies, 99);

    const p95Db = this.getPercentile(this.dbQueryLatencies, 95);

    const totalCacheRequests = this.cacheStats.hits + this.cacheStats.misses;
    const cacheHitRate = totalCacheRequests > 0 ? (this.cacheStats.hits / totalCacheRequests) * 100 : 0;

    const queueAgeObj = {};
    for (const [k, v] of this.queueAges.entries()) {
      queueAgeObj[k] = v;
    }

    const externalHealth = {};
    for (const [k, v] of this.externalFailures.entries()) {
      externalHealth[k] = { ...v };
    }

    return {
      timestamp: new Date().toISOString(),
      apiLatency: {
        samples: this.apiLatencies.length,
        p50: Number(p50Api.toFixed(2)),
        p95: Number(p95Api.toFixed(2)),
        p99: Number(p99Api.toFixed(2)),
      },
      aiLatency: {
        samples: this.aiLatencies.length,
        p50: Number(p50Ai.toFixed(2)),
        p95: Number(p95Ai.toFixed(2)),
        p99: Number(p99Ai.toFixed(2)),
      },
      dbQueryLatency: {
        samples: this.dbQueryLatencies.length,
        p95: Number(p95Db.toFixed(2)),
      },
      backlogs: {
        verificationBacklog: this.verificationBacklog,
        slaBacklog: this.slaBacklog,
      },
      queues: queueAgeObj,
      cache: {
        ...this.cacheStats,
        hitRate: Number(cacheHitRate.toFixed(2)),
      },
      integrations: externalHealth,
    };
  }

  /**
   * Formats metrics in standard Prometheus exposition format
   * for cloud-native scrapers (Datadog, Prometheus, Grafana Agent).
   */
  toPrometheusFormat() {
    const snapshot = this.getSnapshot();
    const lines = [
      '# HELP civiq_api_latency_ms API response latency percentiles',
      '# TYPE civiq_api_latency_ms gauge',
      `civiq_api_latency_ms{quantile="0.5"} ${snapshot.apiLatency.p50}`,
      `civiq_api_latency_ms{quantile="0.95"} ${snapshot.apiLatency.p95}`,
      `civiq_api_latency_ms{quantile="0.99"} ${snapshot.apiLatency.p99}`,
      '',
      '# HELP civiq_ai_latency_ms AI inference latency percentiles',
      '# TYPE civiq_ai_latency_ms gauge',
      `civiq_ai_latency_ms{quantile="0.5"} ${snapshot.aiLatency.p50}`,
      `civiq_ai_latency_ms{quantile="0.95"} ${snapshot.aiLatency.p95}`,
      `civiq_ai_latency_ms{quantile="0.99"} ${snapshot.aiLatency.p99}`,
      '',
      '# HELP civiq_verification_backlog Number of unverified civic issues',
      '# TYPE civiq_verification_backlog gauge',
      `civiq_verification_backlog ${snapshot.backlogs.verificationBacklog}`,
      '',
      '# HELP civiq_sla_breach_backlog Number of issues with breached SLA',
      '# TYPE civiq_sla_breach_backlog gauge',
      `civiq_sla_breach_backlog ${snapshot.backlogs.slaBacklog}`,
      '',
      '# HELP civiq_cache_hit_ratio Safe cache hit percentage',
      '# TYPE civiq_cache_hit_ratio gauge',
      `civiq_cache_hit_ratio ${snapshot.cache.hitRate}`,
    ];

    for (const [queue, age] of Object.entries(snapshot.queues)) {
      lines.push(`civiq_queue_age_ms{queue="${queue}"} ${age}`);
    }

    return lines.join('\n') + '\n';
  }
}

export const metricsCollector = new MetricsCollector();
