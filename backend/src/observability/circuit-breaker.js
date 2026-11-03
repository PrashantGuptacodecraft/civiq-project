/**
 * Circuit Breaker for External Integrations Resilience
 * Phase 71: Performance, Resilience, and Observability Closure
 */

import { metricsCollector } from './metrics.js';

export const CIRCUIT_STATE = {
  CLOSED: 'CLOSED', // Normal operation
  OPEN: 'OPEN',     // Failing; fast-fallback
  HALF_OPEN: 'HALF_OPEN', // Testing recovery
};

export class CircuitBreaker {
  /**
   * @param {string} name - Integration name
   * @param {Object} options
   * @param {number} options.failureThreshold - Number of consecutive failures to open circuit (default: 5)
   * @param {number} options.cooldownMs - Cooldown before attempting HALF_OPEN probe (default: 15s)
   * @param {number} options.timeoutMs - Timeout for individual execution (default: 5000ms)
   */
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 5;
    this.cooldownMs = options.cooldownMs || 15000;
    this.timeoutMs = options.timeoutMs || 5000;
    this.state = CIRCUIT_STATE.CLOSED;
    this.consecutiveFailures = 0;
    this.lastFailureTime = 0;
    this.successCount = 0;
  }

  async execute(primaryFn, fallbackFn) {
    // If OPEN, check if cooldown elapsed to transition to HALF_OPEN
    if (this.state === CIRCUIT_STATE.OPEN) {
      if (Date.now() - this.lastFailureTime > this.cooldownMs) {
        this.state = CIRCUIT_STATE.HALF_OPEN;
      } else {
        // Fast-fail without calling remote downstream
        if (fallbackFn) return await fallbackFn(new Error(`Circuit open for ${this.name}`));
        throw new Error(`Circuit open for ${this.name}; request rejected.`);
      }
    }

    try {
      // Execute with timeout guarantee
      const result = await this._withTimeout(primaryFn, this.timeoutMs);

      // On successful probe in HALF_OPEN, close circuit
      this.consecutiveFailures = 0;
      this.state = CIRCUIT_STATE.CLOSED;
      this.successCount++;
      metricsCollector.recordIntegrationSuccess(this.name);
      return result;
    } catch (err) {
      this.consecutiveFailures++;
      this.lastFailureTime = Date.now();

      // Trip circuit if threshold reached or if failure occurred during HALF_OPEN probe
      if (this.consecutiveFailures >= this.failureThreshold || this.state === CIRCUIT_STATE.HALF_OPEN) {
        this.state = CIRCUIT_STATE.OPEN;
      }
      metricsCollector.recordIntegrationFailure(this.name, err, this.state === CIRCUIT_STATE.OPEN);

      if (fallbackFn) {
        return await fallbackFn(err);
      }
      throw err;
    }
  }

  async _withTimeout(fn, timeoutMs) {
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`Call to ${this.name} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([fn(), timeoutPromise]);
    } finally {
      clearTimeout(timer);
    }
  }

  getStatus() {
    return {
      name: this.name,
      state: this.state,
      consecutiveFailures: this.consecutiveFailures,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
      cooldownMs: this.cooldownMs,
      timeoutMs: this.timeoutMs,
    };
  }

  reset() {
    this.state = CIRCUIT_STATE.CLOSED;
    this.consecutiveFailures = 0;
    this.lastFailureTime = 0;
    metricsCollector.recordIntegrationSuccess(this.name);
  }
}
