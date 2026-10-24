export const DEFAULT_ESCALATION_CONFIG = {
    warningThresholdPct: 75,
    breachThresholdPct: 100,
    criticalBreachThresholdPct: 150,
    cooldownMinutes: 60,
};
export class EscalationPolicy {
    config;
    constructor(config = DEFAULT_ESCALATION_CONFIG) {
        this.config = config;
    }
    getConfig() {
        return this.config;
    }
    /**
     * Evaluates SLA metrics to determine the appropriate escalation level.
     */
    determineEscalationLevel(params) {
        const cfg = { ...this.config, ...(params.customConfig || {}) };
        const { slaPercentage, priorityTier, isOverdue } = params;
        // 1. Within normal SLA operating window
        if (!isOverdue && slaPercentage < cfg.warningThresholdPct) {
            return 'NONE';
        }
        // 2. SLA Warning threshold reached (e.g. 75% to 99%)
        if (!isOverdue && slaPercentage >= cfg.warningThresholdPct) {
            return 'WARNING';
        }
        // 3. SLA Breached (100%+)
        if (isOverdue || slaPercentage >= cfg.breachThresholdPct) {
            // Escalation Rule: P1 Critical issues or severe breaches (>=150% or >24h overdue) escalate directly to Department Officer
            const isSevereBreach = priorityTier === 'P1_CRITICAL' ||
                slaPercentage >= cfg.criticalBreachThresholdPct ||
                params.remainingHours <= -24.0;
            if (isSevereBreach) {
                return 'OFFICER_CRITICAL_BREACH';
            }
            // Standard breach escalates to Field Supervisor
            return 'SUPERVISOR_BREACH';
        }
        return 'NONE';
    }
    /**
     * Resolves target roles that should receive alerts for a given escalation level.
     */
    resolveTargetRoles(level) {
        switch (level) {
            case 'WARNING':
                return ['FIELD_WORKER', 'FIELD_SUPERVISOR'];
            case 'SUPERVISOR_BREACH':
                return ['FIELD_SUPERVISOR', 'DEPARTMENT_OFFICER'];
            case 'OFFICER_CRITICAL_BREACH':
                return ['DEPARTMENT_OFFICER', 'DISTRICT_ULB_ADMIN', 'FIELD_SUPERVISOR'];
            case 'NONE':
            default:
                return [];
        }
    }
    /**
     * Generates formatted title and message for notification dispatch.
     */
    generateNotificationCopy(params) {
        const { issueTitle, level, slaPercentage, remainingHours, dueAt } = params;
        const formattedDue = dueAt.toISOString();
        switch (level) {
            case 'WARNING':
                return {
                    title: `[SLA WARNING] Issue #${params.issueId.slice(0, 8)} nearing deadline`,
                    message: `Issue "${issueTitle}" has reached ${slaPercentage.toFixed(0)}% of its SLA window. Target deadline: ${formattedDue}. Please accelerate field resolution.`,
                };
            case 'SUPERVISOR_BREACH':
                return {
                    title: `[SLA BREACH - ESCALATED] Issue #${params.issueId.slice(0, 8)} overdue`,
                    message: `Issue "${issueTitle}" has breached its SLA deadline (overdue by ${Math.abs(remainingHours).toFixed(1)}h). Escalated to Field Supervisor for immediate intervention.`,
                };
            case 'OFFICER_CRITICAL_BREACH':
                return {
                    title: `[CRITICAL SLA BREACH] Escalated to Department Officer: #${params.issueId.slice(0, 8)}`,
                    message: `CRITICAL ESCALATION: Issue "${issueTitle}" is severely overdue (${slaPercentage.toFixed(0)}% SLA elapsed, ${Math.abs(remainingHours).toFixed(1)}h past deadline). Escalated to Department Officer and ULB Administration.`,
                };
            case 'NONE':
            default:
                return {
                    title: `SLA Update for Issue #${params.issueId}`,
                    message: `Issue "${issueTitle}" is currently within normal operating SLA (${slaPercentage.toFixed(0)}%).`,
                };
        }
    }
}
export const defaultEscalationPolicy = new EscalationPolicy();
