import { prisma } from '@civiq/db';
import { slaEngine } from './sla.engine.js';
import { slaRuleMatrix } from './sla.matrix.js';
export class SlaService {
    engine;
    matrix;
    constructor(engine = slaEngine, matrix = slaRuleMatrix) {
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
    async getIssueSlaStatusById(issueId, referenceTime) {
        const issue = await prisma.issue.findUnique({
            where: { id: issueId },
        });
        if (!issue || !issue.categoryId) {
            return null;
        }
        return this.evaluateIssueSla({
            issueId: issue.id,
            categoryId: issue.categoryId,
            severity: issue.severity || 'MEDIUM',
            jurisdictionId: issue.jurisdictionId ?? undefined,
            createdAt: issue.createdAt,
            referenceTime,
        });
    }
    /**
     * Register or override a custom SLA rule.
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
