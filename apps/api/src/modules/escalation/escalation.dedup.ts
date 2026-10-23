import { EscalationLevel } from './escalation.types';

export interface DedupCheckResult {
  isDuplicate: boolean;
  idempotencyKey: string;
  suppressionReason?: string | undefined;
}

export interface EscalationRecordEntry {
  idempotencyKey: string;
  issueId: string;
  level: EscalationLevel;
  timestamp: number;
}

export class EscalationDedupEngine {
  private records: Map<string, EscalationRecordEntry> = new Map();

  /**
   * Generates deterministic idempotency key for an issue's escalation level.
   */
  public computeIdempotencyKey(issueId: string, level: EscalationLevel): string {
    return `esc_${issueId}_${level.toLowerCase()}`;
  }

  /**
   * Checks whether this escalation was recently triggered and registers it if new.
   * Prevents alert storms by enforcing a configurable cooldown period.
   */
  public checkAndRegister(
    issueId: string,
    level: EscalationLevel,
    cooldownMinutes: number = 60,
    referenceTime: Date = new Date()
  ): DedupCheckResult {
    const key = this.computeIdempotencyKey(issueId, level);
    const existing = this.records.get(key);
    const nowMs = referenceTime.getTime();
    const cooldownMs = cooldownMinutes * 60 * 1000;

    if (existing) {
      const elapsedMs = nowMs - existing.timestamp;
      if (elapsedMs < cooldownMs) {
        const remainingCooldownMinutes = Math.ceil((cooldownMs - elapsedMs) / (60 * 1000));
        return {
          isDuplicate: true,
          idempotencyKey: key,
          suppressionReason: `Escalation level '${level}' for issue '${issueId}' was already triggered ${Math.round(
            elapsedMs / 60000
          )} minutes ago. Suppressed to prevent duplicate alert storm (cooldown active for ${remainingCooldownMinutes} more mins).`,
        };
      }
    }

    // Register or update timestamp
    this.records.set(key, {
      idempotencyKey: key,
      issueId,
      level,
      timestamp: nowMs,
    });

    return {
      isDuplicate: false,
      idempotencyKey: key,
    };
  }

  /**
   * Clear all records (useful for testing or cache eviction).
   */
  public reset(): void {
    this.records.clear();
  }

  public getRecord(key: string): EscalationRecordEntry | undefined {
    return this.records.get(key);
  }

  public getAllRecords(): EscalationRecordEntry[] {
    return Array.from(this.records.values());
  }
}

export const escalationDedupEngine = new EscalationDedupEngine();
