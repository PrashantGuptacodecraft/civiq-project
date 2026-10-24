import { describe, it, expect } from 'vitest';
import { PriorityEngine, priorityEngine } from './priority.service.js';
describe('PriorityEngine', () => {
    it('extracts deterministic features accurately across all dimensions', () => {
        const features = priorityEngine.extractFeatures({
            issueId: 'iss-test-1',
            title: 'Exposed live electric wire near metro station',
            description: 'Cable sparking on wet sidewalk outside transit gate',
            category: 'electrical_hanging_wires',
            severity: 'CRITICAL',
            reporterTrustScore: 92,
            upvotesCount: 15,
            ageHours: 2.5,
            corroborationCount: 3,
            locationContext: {
                isTransitHub: true,
            },
        });
        // 1. Severity: CRITICAL -> 95
        expect(features.severityScore).toBe(95);
        // 2. Safety Risk: live wire + electrical category -> >= 90
        expect(features.safetyRiskScore).toBeGreaterThanOrEqual(90);
        expect(features.safetyFlags).toContain('LIFE_SAFETY_CRITICAL');
        // 3. Impact: transit hub + 15 upvotes -> >= 65
        expect(features.impactScore).toBeGreaterThanOrEqual(65);
        // 4. Corroboration: 92 trust + 3 corroborations + upvotes -> >= 85
        expect(features.corroborationScore).toBeGreaterThanOrEqual(85);
        // 5. Age & time decay: 2.5 hours -> ageScore ~35, decayFactor ~1.05
        expect(features.ageScore).toBe(35);
        expect(features.timeDecayFactor).toBe(1.05);
        // 6. Location context: transit hub -> >= 75
        expect(features.locationContextScore).toBeGreaterThanOrEqual(75);
        // Explainability assertions: reasons list must document the factors
        expect(features.reasons.length).toBeGreaterThanOrEqual(5);
        const combinedReasons = features.reasons.join(' ').toLowerCase();
        expect(combinedReasons).toContain('critical');
        expect(combinedReasons).toContain('safety');
        expect(combinedReasons).toContain('upvotes');
    });
    it('triggers Rule 1: Life-safety critical override rule to floor score to 85 (P1_CRITICAL)', () => {
        const result = priorityEngine.calculatePriority({
            issueId: 'iss-crit-rule',
            title: 'Dangerous gas leak and sparking electrical pole',
            description: 'Immediate fire and explosion hazard on road',
            category: 'electrical_hanging_wires',
            severity: 'CRITICAL',
            upvotesCount: 0,
            ageHours: 0.2, // brand new, 0 upvotes
        });
        expect(result.priorityScore).toBeGreaterThanOrEqual(85);
        expect(result.priorityTier).toBe('P1_CRITICAL');
        expect(result.recommendedSlaHours).toBe(4);
        expect(result.rulesTriggered.length).toBeGreaterThan(0);
        expect(result.rulesTriggered[0]).toContain('Life-safety critical override');
        expect(result.reasons).toContain(result.rulesTriggered[0]);
    });
    it('triggers Rule 2: Sensitive institutional zone safety escalation near hospital/school', () => {
        const result = priorityEngine.calculatePriority({
            issueId: 'iss-hosp-rule',
            title: 'Deep open trench on road outside City Hospital',
            description: 'Uncovered sewer excavation obstructing ambulance ramp',
            category: 'roads_sinkhole',
            severity: 'HIGH',
            locationContext: {
                isHospitalZone: true,
            },
            upvotesCount: 1,
            ageHours: 1.0,
        });
        expect(result.priorityScore).toBeGreaterThanOrEqual(70);
        expect(['P1_CRITICAL', 'P2_HIGH']).toContain(result.priorityTier);
        expect(result.recommendedSlaHours).toBeLessThanOrEqual(24);
        expect(result.rulesTriggered.some((r) => r.includes('Institutional zone safety escalation'))).toBe(true);
    });
    it('triggers Rule 3: SLA starvation prevention for overdue issues older than 7 days', () => {
        const result = priorityEngine.calculatePriority({
            issueId: 'iss-starve-rule',
            title: 'Small road pothole in residential colony',
            description: 'Minor asphalt indentation',
            category: 'roads_pothole',
            severity: 'LOW',
            upvotesCount: 0,
            ageHours: 180.0, // 7.5 days overdue
        });
        // Even though base severity is LOW (25), starvation escalation guarantees at least 60 (P2_HIGH)
        expect(result.priorityScore).toBeGreaterThanOrEqual(60);
        expect(result.priorityTier).toBe('P2_HIGH');
        expect(result.recommendedSlaHours).toBe(24);
        expect(result.rulesTriggered.some((r) => r.includes('SLA starvation prevention'))).toBe(true);
        expect(result.reasons.some((r) => r.includes('starvation'))).toBe(true);
    });
    it('allows configurable weights to alter scoring priorities deterministically', () => {
        const params = {
            issueId: 'iss-weights-test',
            title: 'Water supply pipeline burst',
            description: 'Flooding residential area for 2 days',
            category: 'water_pipeline_leak',
            severity: 'MEDIUM',
            upvotesCount: 30,
            ageHours: 48.0,
        };
        // Standard weights
        const defaultRes = priorityEngine.calculatePriority(params);
        // Custom weights heavily prioritizing impact (0.50) and age (0.30)
        const customEngine = new PriorityEngine({
            severity: 0.05,
            safetyRisk: 0.05,
            impact: 0.50,
            corroboration: 0.05,
            age: 0.30,
            locationContext: 0.05,
        });
        const customRes = customEngine.calculatePriority(params);
        expect(customRes.priorityScore).not.toBe(defaultRes.priorityScore);
        expect(customRes.decisionEvidence.weights.impact).toBeGreaterThan(defaultRes.decisionEvidence.weights.impact);
        expect(customRes.decisionEvidence.subscores.impact).toBeGreaterThanOrEqual(60);
    });
    it('provides complete transparent decision evidence and audit trail', () => {
        const result = priorityEngine.calculatePriority({
            issueId: 'iss-evidence-test',
            title: 'Broken streetlight on dark road',
            description: 'Entire street dark at night',
            category: 'roads_streetlighting',
            severity: 'MEDIUM',
            upvotesCount: 5,
            ageHours: 10.0,
        });
        expect(result.decisionEvidence).toBeDefined();
        expect(result.decisionEvidence.weights).toBeDefined();
        expect(result.decisionEvidence.subscores).toEqual(expect.objectContaining({
            severity: expect.any(Number),
            safetyRisk: expect.any(Number),
            impact: expect.any(Number),
            corroboration: expect.any(Number),
            age: expect.any(Number),
            locationContext: expect.any(Number),
        }));
        expect(result.decisionEvidence.baseScore).toBeDefined();
        expect(result.decisionEvidence.decayedScore).toBeDefined();
        expect(result.decisionEvidence.finalScore).toBe(result.priorityScore);
    });
});
