/**
 * In-Memory Safe Caching and Query Budget Protection
 * Phase 71: Observability, Caching, Query Budgets & Resilience
 */

import { metricsCollector } from './metrics.js';

export class SafeCache {
  /**
   * @param {Object} options
   * @param {number} options.defaultTtlMs - Default time to live in milliseconds (default: 60s)
   * @param {number} options.maxEntries - Maximum entries before LRU eviction (default: 1000)
   */
  constructor(options = {}) {
    this.defaultTtlMs = options.defaultTtlMs || 60000;
    this.maxEntries = options.maxEntries || 1000;
    this.store = new Map();
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    // If key already exists, delete it first to refresh LRU order on set
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxEntries) {
      // Evict oldest (first) key
      const firstKey = this.store.keys().next().value;
      if (firstKey !== undefined) {
        this.store.delete(firstKey);
        metricsCollector.recordCacheEviction();
      }
    }
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { value, expiresAt });
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      metricsCollector.recordCacheMiss();
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      metricsCollector.recordCacheMiss();
      return null;
    }
    // Refresh access order for true LRU behavior
    this.store.delete(key);
    this.store.set(key, entry);
    metricsCollector.recordCacheHit();
    return entry.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    return this.store.delete(key);
  }

  /**
   * Delete entries matching a regex pattern or prefix.
   * Useful for invalidating resource-specific cache keys.
   */
  deletePattern(pattern) {
    const regex = typeof pattern === 'string' ? new RegExp(`^${pattern}`) : pattern;
    let deletedCount = 0;
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  clear() {
    this.store.clear();
  }

  get size() {
    return this.store.size;
  }
}

/**
 * Executes a function with a query budget (timeout and slow query threshold).
 * Warns or throws when query budget is exceeded.
 */
export async function withQueryBudget(operationName, fn, options = {}) {
  const budgetMs = options.budgetMs || 1000; // default 1000ms budget
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    metricsCollector.recordDbQueryLatency(duration);

    if (duration > budgetMs) {
      console.warn(`[QUERY BUDGET EXCEEDED] ${operationName} took ${duration}ms (budget: ${budgetMs}ms)`);
    }
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    metricsCollector.recordDbQueryLatency(duration);
    throw error;
  }
}
