import { prisma } from '@civiq/shared-db';
import {
  SlaCalculationInput,
  SlaEvaluationResult,
  SlaRuleConfig,
} from './sla.types';
import { SlaEngine, slaEngine } from './sla.engine';
import { SlaRuleMatrix, slaRuleMatrix } from './sla.matrix';

export class SlaService {
  engine;
  matrix;

  constructor(
    engine = slaEngine,
    matrix = slaRuleMatrix
  ) {
    this.engine = engine;
    this.matrix = matrix;
  }

  /**
   * Evaluate SLA rules, due dates, aging, and real-time countdown for an issue.
   */
  evaluateIssueSla(input) {
    return this.engine.evaluateSla(input);
  }

  /**
   * Load an issue from the database and evaluate its SLA status.
   */
  async getIssueSlaStatusById(
    issueId,
    referenceTime?
  ) {
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
   * Register or a custom SLA rule.
   */
  configureRule(rule) {
    this.matrix.registerRule(rule);
  }

  /**
   * List all registered SLA rules.
   */
  getRules() {
    return this.matrix.listRules();
  }
}

export const slaService = new SlaService();