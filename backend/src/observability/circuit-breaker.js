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
   */
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 5;
    this.cooldownMs = options.cooldownMs || 15000;
    this.state = CIRCUIT_STATE.CLOSED;
    this.consecutiveFailures = 0;
    this.lastFailureTime = 0;
  }

  async execute(primaryFn, fallbackFn) {
    // If OPEN, check if cooldown elapsed to try HALF_OPEN
    if (this.state === CIRCUIT_STATE.OPEN) {
      if (Date.now() - this.lastFailureTime > this.cooldownMs) {
        this.state = CIRCUIT_STATE.HALF_OPEN;
      } else {
        // Circuit open: directly execute fallback without calling external service
        if (fallbackFn) return await fallbackFn(new Error(`Circuit open for ${this.name}`));
        throw new Error(`Circuit open for ${this.name}; request rejected.`);
      }
    }

    try {
      const result = await primaryFn();
      // On success in HALF_OPEN or CLOSED
      this.consecutiveFailures = 0;
      this.state = CIRCUIT_STATE.CLOSED;
      metricsCollector.recordIntegrationSuccess(this.name);
      return result;
    } catch (err) {
      this.consecutiveFailures++;
      this.lastFailureTime = Date.now();
      metricsCollector.recordIntegrationFailure(this.name, err);

      if (this.consecutiveFailures >= this.failureThreshold || this.state === CIRCUIT_STATE.HALF_OPEN) {
        this.state = CIRCUIT_STATE.OPEN;
      }

      if (fallbackFn) {
        return await fallbackFn(err);
      }
      throw err;
    }
  }

  reset() {
    this.state = CIRCUIT_STATE.CLOSED;
    this.consecutiveFailures = 0;
    this.lastFailureTime = 0;
  }
}
