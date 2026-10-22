import { prisma } from '@civiq/db';
import {
  SlaCalculationInput,
  SlaEvaluationResult,
  SlaRuleConfig,
} from './sla.types';
import { SlaEngine, slaEngine } from './sla.engine';
import { SlaRuleMatrix, slaRuleMatrix } from './sla.matrix';

export class SlaService {
  private engine: SlaEngine;
  private matrix: SlaRuleMatrix;

  constructor(
    engine: SlaEngine = slaEngine,
    matrix: SlaRuleMatrix = slaRuleMatrix
  ) {
    this.engine = engine;
    this.matrix = matrix;
  }

  /**
   * Evaluate SLA rules, due dates, aging, and real-time countdown for an issue.
   */
  public evaluateIssueSla(input: SlaCalculationInput): SlaEvaluationResult {
    return this.engine.evaluateSla(input);
  }

  /**
   * Load an issue from the database and evaluate its SLA status.
   */
  public async getIssueSlaStatusById(
    issueId: string,
    referenceTime?: Date | undefined
  ): Promise<SlaEvaluationResult | null> {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
    });

    if (!issue || !issue.categoryId) {
      return null;
    }

    return this.evaluateIssueSla({
      issueId: issue.id,
      categoryId: issue.categoryId,
      severity: (issue.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') || 'MEDIUM',
      jurisdictionId: issue.jurisdictionId ?? undefined,
      createdAt: issue.createdAt,
      referenceTime,
    });
  }

  /**
   * Register or override a custom SLA rule.
   */
  public configureRule(rule: SlaRuleConfig): void {
    this.matrix.registerRule(rule);
  }

  /**
   * List all registered SLA rules.
   */
  public getRules(): SlaRuleConfig[] {
    return this.matrix.listRules();
  }
}

export const slaService = new SlaService();
