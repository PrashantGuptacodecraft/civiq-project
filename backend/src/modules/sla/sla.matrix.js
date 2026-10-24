export const DEFAULT_PRIORITY_SLA_RULES = {
    P1_CRITICAL: { targetHours: 4, mode: 'CONTINUOUS_24_7' },
    P2_HIGH: { targetHours: 24, mode: 'CONTINUOUS_24_7' },
    P3_MEDIUM: { targetHours: 72, mode: 'BUSINESS_HOURS' },
    P4_LOW: { targetHours: 168, mode: 'BUSINESS_HOURS' },
};
export const DEFAULT_CATEGORY_SLA_RULES = [
    {
        id: 'rule-cat-electrical-wires',
        categoryId: 'electrical_hanging_wires',
        targetDurationHours: 4,
        workingHoursMode: 'CONTINUOUS_24_7',
        warningThresholdPercentage: 75,
        description: 'Dangerous live wires: 4-hour 24/7 emergency response SLA',
    },
    {
        id: 'rule-cat-open-manhole',
        categoryId: 'sanitation_open_manhole',
        targetDurationHours: 6,
        workingHoursMode: 'CONTINUOUS_24_7',
        warningThresholdPercentage: 75,
        description: 'Missing manhole cover: 6-hour 24/7 life safety SLA',
    },
    {
        id: 'rule-cat-water-no-supply',
        categoryId: 'water_no_supply',
        targetDurationHours: 12,
        workingHoursMode: 'CONTINUOUS_24_7',
        warningThresholdPercentage: 75,
        description: 'Complete water outage: 12-hour continuous restoration SLA',
    },
    {
        id: 'rule-cat-dead-animal',
        categoryId: 'waste_dead_animal',
        targetDurationHours: 12,
        workingHoursMode: 'BUSINESS_HOURS',
        warningThresholdPercentage: 75,
        description: 'Animal carcass clearance: 12 business hours SLA',
    },
    {
        id: 'rule-cat-pipeline-leak',
        categoryId: 'water_pipeline_leak',
        targetDurationHours: 24,
        workingHoursMode: 'BUSINESS_HOURS',
        warningThresholdPercentage: 75,
        description: 'Water pipeline burst: 24 business hours SLA',
    },
    {
        id: 'rule-cat-blocked-drain',
        categoryId: 'sanitation_blocked_drain',
        targetDurationHours: 24,
        workingHoursMode: 'BUSINESS_HOURS',
        warningThresholdPercentage: 75,
        description: 'Drain overflow: 24 business hours SLA',
    },
    {
        id: 'rule-cat-pothole',
        categoryId: 'roads_pothole',
        targetDurationHours: 72,
        workingHoursMode: 'BUSINESS_HOURS',
        warningThresholdPercentage: 75,
        description: 'Road pothole patching: 72 business hours (3 business days) SLA',
    },
    {
        id: 'rule-cat-streetlighting',
        categoryId: 'roads_streetlighting',
        targetDurationHours: 48,
        workingHoursMode: 'BUSINESS_HOURS',
        warningThresholdPercentage: 75,
        description: 'Streetlight repair: 48 business hours SLA',
    },
    {
        id: 'rule-cat-garbage-dump',
        categoryId: 'waste_garbage_dump',
        targetDurationHours: 48,
        workingHoursMode: 'BUSINESS_HOURS',
        warningThresholdPercentage: 75,
        description: 'Garbage dump clearance: 48 business hours SLA',
    },
    {
        id: 'rule-cat-footpath-damage',
        categoryId: 'roads_footpath_damage',
        targetDurationHours: 120,
        workingHoursMode: 'BUSINESS_HOURS',
        warningThresholdPercentage: 75,
        description: 'Footpath damage repair: 120 business hours (5 business days) SLA',
    },
    {
        id: 'rule-cat-public-toilet',
        categoryId: 'facilities_public_toilet',
        targetDurationHours: 48,
        workingHoursMode: 'BUSINESS_HOURS',
        warningThresholdPercentage: 75,
        description: 'Public toilet maintenance: 48 business hours SLA',
    },
];
export class SlaRuleMatrix {
    rules = new Map();
    constructor(initialRules = DEFAULT_CATEGORY_SLA_RULES) {
        for (const r of initialRules) {
            this.rules.set(r.id, r);
        }
    }
    registerRule(rule) {
        this.rules.set(rule.id, rule);
    }
    listRules() {
        return Array.from(this.rules.values());
    }
    /**
     * Resolves the most specific matching SLA rule for an issue:
     * 1. Jurisdiction + Category + Priority
     * 2. Jurisdiction + Category
     * 3. Jurisdiction + Priority
     * 4. Category + Priority
     * 5. Category Default
     * 6. Priority Tier Default
     * 7. Global Baseline Default
     */
    resolveSlaRule(params) {
        const { categoryId, priorityTier, jurisdictionId } = params;
        const allRules = Array.from(this.rules.values());
        // 1. Jurisdiction + Category + Priority
        if (jurisdictionId && priorityTier) {
            const match = allRules.find((r) => r.jurisdictionId === jurisdictionId &&
                r.categoryId === categoryId &&
                r.priorityTier === priorityTier);
            if (match)
                return match;
        }
        // 2. Jurisdiction + Category
        if (jurisdictionId) {
            const match = allRules.find((r) => r.jurisdictionId === jurisdictionId && r.categoryId === categoryId);
            if (match)
                return match;
        }
        // 3. Jurisdiction + Priority
        if (jurisdictionId && priorityTier) {
            const match = allRules.find((r) => r.jurisdictionId === jurisdictionId &&
                !r.categoryId &&
                r.priorityTier === priorityTier);
            if (match)
                return match;
        }
        // 4. Category + Priority
        if (priorityTier) {
            const match = allRules.find((r) => !r.jurisdictionId && r.categoryId === categoryId && r.priorityTier === priorityTier);
            if (match)
                return match;
        }
        // 5. Category Default
        const catMatch = allRules.find((r) => !r.jurisdictionId && r.categoryId === categoryId);
        if (catMatch) {
            // If priority tier is P1_CRITICAL, enforce 24/7 mode and clamp duration to max 4 hours
            if (priorityTier === 'P1_CRITICAL' && catMatch.workingHoursMode !== 'CONTINUOUS_24_7') {
                return {
                    ...catMatch,
                    id: `${catMatch.id}-escalated-p1`,
                    targetDurationHours: Math.min(catMatch.targetDurationHours, 4),
                    workingHoursMode: 'CONTINUOUS_24_7',
                    description: `P1 Critical safety escalation override for ${catMatch.categoryId}`,
                };
            }
            return catMatch;
        }
        // 6. Priority Tier Default
        if (priorityTier) {
            const tierDef = DEFAULT_PRIORITY_SLA_RULES[priorityTier];
            return {
                id: `rule-tier-${priorityTier.toLowerCase()}`,
                priorityTier,
                targetDurationHours: tierDef.targetHours,
                workingHoursMode: tierDef.mode,
                warningThresholdPercentage: 75,
                description: `Standard priority ${priorityTier} SLA (${tierDef.targetHours}h)`,
            };
        }
        // 7. Global Baseline Default
        return {
            id: 'rule-global-default',
            targetDurationHours: 72,
            workingHoursMode: 'BUSINESS_HOURS',
            warningThresholdPercentage: 75,
            description: 'Global standard civic maintenance baseline (72h)',
        };
    }
}
export const slaRuleMatrix = new SlaRuleMatrix();
