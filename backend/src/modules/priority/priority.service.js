import { prisma } from '@civiq/db';
const SAFETY_CRITICAL_KEYWORDS = [
    'sparking',
    'live wire',
    'electric wire',
    'electrocution',
    'gas leak',
    'explosion',
    'structural collapse',
    'bridge crack',
    'sinkhole',
    'toxic fumes',
    'chemical spill',
    'sewage in drinking water',
    'unconscious',
    'casualty',
];
const SAFETY_HIGH_CATEGORIES = new Set([
    'electrical_hanging_wires',
    'electrical_transformer_spark',
    'sanitation_open_manhole',
    'roads_sinkhole',
    'water_contamination',
    'disaster_flood',
]);
const SAFETY_MEDIUM_CATEGORIES = new Set([
    'roads_pothole',
    'roads_streetlighting',
    'sanitation_blocked_drain',
    'water_pipeline_leak',
    'traffic_signal_failure',
]);
const DEFAULT_WEIGHTS = {
    severity: 0.25,
    safetyRisk: 0.25,
    impact: 0.20,
    corroboration: 0.10,
    age: 0.10,
    locationContext: 0.10,
};
const SLA_TIER_HOURS = {
    P1_CRITICAL: 4,
    P2_HIGH: 24,
    P3_MEDIUM: 72,
    P4_LOW: 168,
};
export class PriorityEngine {
    defaultWeights;
    constructor(customWeights) {
        this.defaultWeights = this.normalizeWeights(customWeights);
    }
    normalizeWeights(w) {
        const raw = {
            severity: w?.severity ?? 0.25,
            safetyRisk: w?.safetyRisk ?? 0.25,
            impact: w?.impact ?? 0.20,
            corroboration: w?.corroboration ?? 0.10,
            age: w?.age ?? 0.10,
            locationContext: w?.locationContext ?? 0.10,
        };
        const sum = Object.values(raw).reduce((a, b) => a + b, 0);
        if (sum <= 0)
            return DEFAULT_WEIGHTS;
        return {
            severity: Number((raw.severity / sum).toFixed(4)),
            safetyRisk: Number((raw.safetyRisk / sum).toFixed(4)),
            impact: Number((raw.impact / sum).toFixed(4)),
            corroboration: Number((raw.corroboration / sum).toFixed(4)),
            age: Number((raw.age / sum).toFixed(4)),
            locationContext: Number((raw.locationContext / sum).toFixed(4)),
        };
    }
    /**
     * Deterministically extract features for an issue.
     */
    extractFeatures(params) {
        const combined = `${params.title} ${params.description}`.toLowerCase();
        const reasons = [];
        // 1. Severity Feature
        const severityMap = {
            CRITICAL: 95.0,
            HIGH: 75.0,
            MEDIUM: 50.0,
            LOW: 25.0,
        };
        const baseSeverity = severityMap[params.severity] ?? 50.0;
        let severityScore = baseSeverity;
        const detectedKeywords = SAFETY_CRITICAL_KEYWORDS.filter((kw) => combined.includes(kw));
        if (detectedKeywords.length > 0 && params.severity !== 'CRITICAL') {
            const bump = params.severity === 'HIGH' ? 15.0 : 20.0;
            severityScore = Math.min(95.0, baseSeverity + bump);
            reasons.push(`Severity escalated from ${params.severity} to ${severityScore} due to critical keywords: ${detectedKeywords.slice(0, 2).join(', ')}`);
        }
        else {
            reasons.push(`${params.severity} severity rating assigned (${baseSeverity}/100)`);
        }
        // 2. Safety Risk Feature
        let safetyScore = 20.0;
        const safetyFlags = [];
        if (SAFETY_HIGH_CATEGORIES.has(params.category)) {
            safetyScore = Math.max(safetyScore, 85.0);
            safetyFlags.push('HIGH_RISK_CATEGORY');
            reasons.push(`Category '${params.category}' carries high public safety risk`);
        }
        else if (SAFETY_MEDIUM_CATEGORIES.has(params.category)) {
            safetyScore = Math.max(safetyScore, 50.0);
            safetyFlags.push('MODERATE_RISK_CATEGORY');
        }
        if (detectedKeywords.length > 0) {
            safetyScore = Math.max(safetyScore, 90.0);
            safetyFlags.push('LIFE_SAFETY_CRITICAL');
            reasons.push(`Physical safety hazard detected: ${detectedKeywords.slice(0, 2).join(', ')}`);
        }
        if (combined.includes('manhole') || combined.includes('drain cover') || combined.includes('open pit')) {
            safetyScore = Math.max(safetyScore, 80.0);
            safetyFlags.push('FALL_HAZARD');
            reasons.push('Uncovered drainage pit presents immediate fall hazard');
        }
        const darkSignals = combined.includes('street lamp') || combined.includes('dark');
        const roadSignals = combined.includes('highway') || combined.includes('main road');
        if (darkSignals && roadSignals) {
            safetyScore = Math.max(safetyScore, 65.0);
            safetyFlags.push('ROAD_SAFETY_HAZARD');
            reasons.push('Darkness on high-speed roadway impairs night-time vehicle visibility');
        }
        // 3. Impact Feature
        let impactScore = 30.0;
        const transitKws = ['arterial', 'highway', 'main road', 'metro', 'bus stand', 'flyover'];
        if (transitKws.some((k) => combined.includes(k))) {
            impactScore += 25.0;
            reasons.push('Located on major transportation artery or transit node (+25 impact)');
        }
        const wideKws = ['entire area', 'whole colony', 'thousands', 'ward-wide', 'no drinking water'];
        if (wideKws.some((k) => combined.includes(k))) {
            impactScore += 30.0;
            reasons.push('Affects broad community population or residential sector (+30 impact)');
        }
        const upvotes = params.upvotesCount ?? 0;
        if (upvotes > 0) {
            const upvoteBoost = Math.min(30.0, upvotes * 3.0);
            impactScore += upvoteBoost;
            reasons.push(`Corroborated by ${upvotes} citizen upvotes (+${upvoteBoost} community boost)`);
        }
        if (params.locationContext?.isTransitHub)
            impactScore += 15.0;
        if (params.locationContext?.isArterialRoad)
            impactScore += 15.0;
        impactScore = Math.min(100.0, impactScore);
        // 4. Corroboration Feature
        const trust = params.reporterTrustScore ?? 50.0;
        const corrobCount = params.corroborationCount ?? 0;
        const totalConfirmations = corrobCount + Math.floor(upvotes / 3);
        let corrobPoints = 0.0;
        if (totalConfirmations >= 5) {
            corrobPoints = 45.0;
            reasons.push(`Strong multi-citizen corroboration (${totalConfirmations} confirmations, +45)`);
        }
        else if (totalConfirmations >= 2) {
            corrobPoints = 25.0;
            reasons.push(`Moderate multi-party verification (${totalConfirmations} confirmations, +25)`);
        }
        else if (totalConfirmations === 1) {
            corrobPoints = 12.0;
            reasons.push('Single corroborating confirmation recorded (+12)');
        }
        if (trust >= 80.0) {
            reasons.push(`Submitted by high-trust authenticated reporter (${Math.round(trust)}/100)`);
        }
        else if (trust < 30.0) {
            reasons.push(`Reporter account has low historical trust profile (${Math.round(trust)}/100)`);
        }
        const corroborationScore = Math.min(100.0, Math.max(10.0, trust * 0.5 + corrobPoints));
        // 5. Age Feature & Time Decay
        const ageHours = Math.max(0.0, params.ageHours ?? 0.0);
        let ageScore = 15.0;
        let timeDecayFactor = 1.0;
        if (ageHours < 2.0) {
            ageScore = 15.0;
            timeDecayFactor = 1.0;
            reasons.push('Newly reported incident (< 2 hours old)');
        }
        else if (ageHours < 24.0) {
            ageScore = 35.0;
            timeDecayFactor = 1.05;
            reasons.push(`Pending for ${ageHours.toFixed(1)} hours within initial response window`);
        }
        else if (ageHours < 72.0) {
            ageScore = 65.0;
            timeDecayFactor = 1.15;
            reasons.push(`Pending for ${(ageHours / 24.0).toFixed(1)} days without resolution (SLA warning)`);
        }
        else if (ageHours < 168.0) {
            ageScore = 85.0;
            timeDecayFactor = 1.30;
            reasons.push(`Long-pending unresolved issue (${(ageHours / 24.0).toFixed(1)} days); starvation boost applied`);
        }
        else {
            ageScore = 95.0;
            timeDecayFactor = 1.45;
            reasons.push(`Severely overdue (${(ageHours / 24.0).toFixed(1)} days); maximum urgency escalation (starvation prevention applied)`);
        }
        // 6. Location Context Feature
        let locationContextScore = 30.0;
        const ctx = params.locationContext ?? {};
        const isHospital = ctx.isHospitalZone || /\b(hospital|clinic|emergency ward|dispensary)\b/i.test(combined);
        const isSchool = ctx.isSchoolZone || /\b(school|college|kindergarten|campus)\b/i.test(combined);
        const isTransit = ctx.isTransitHub || /\b(metro station|railway|bus depot|bus terminal)\b/i.test(combined);
        const isArterial = ctx.isArterialRoad || /\b(highway|expressway|ring road|arterial road)\b/i.test(combined);
        if (isHospital) {
            locationContextScore = Math.max(locationContextScore, 90.0);
            reasons.push('Located in hospital or emergency medical zone (+60 sensitivity)');
        }
        else if (isSchool) {
            locationContextScore = Math.max(locationContextScore, 85.0);
            reasons.push('Adjacent to school or student pedestrian area (+55 sensitivity)');
        }
        else if (isTransit) {
            locationContextScore = Math.max(locationContextScore, 75.0);
            reasons.push('High-density public transit hub proximity (+45 sensitivity)');
        }
        else if (isArterial) {
            locationContextScore = Math.max(locationContextScore, 70.0);
            reasons.push('High-speed vehicular arterial corridor (+40 sensitivity)');
        }
        const evidence = {
            severity: { score: severityScore, input: params.severity },
            safetyRisk: { score: safetyScore, flags: safetyFlags },
            impact: { score: impactScore, upvotes },
            corroboration: { score: corroborationScore, reporterTrust: trust, count: corrobCount },
            age: { score: ageScore, hours: ageHours, decayFactor: timeDecayFactor },
            locationContext: { score: locationContextScore, hasCoordinates: Boolean(params.location) },
        };
        return {
            severityScore: Number(severityScore.toFixed(2)),
            safetyRiskScore: Number(safetyScore.toFixed(2)),
            impactScore: Number(impactScore.toFixed(2)),
            corroborationScore: Number(corroborationScore.toFixed(2)),
            ageScore: Number(ageScore.toFixed(2)),
            locationContextScore: Number(locationContextScore.toFixed(2)),
            timeDecayFactor: Number(timeDecayFactor.toFixed(2)),
            safetyFlags,
            reasons,
            evidence,
        };
    }
    /**
     * Calculate transparent priority score, tier, and explainability reasons.
     */
    calculatePriority(params, customWeights) {
        const weights = customWeights ? this.normalizeWeights(customWeights) : this.defaultWeights;
        const features = this.extractFeatures(params);
        const baseScore = features.severityScore * weights.severity +
            features.safetyRiskScore * weights.safetyRisk +
            features.impactScore * weights.impact +
            features.corroborationScore * weights.corroboration +
            features.ageScore * weights.age +
            features.locationContextScore * weights.locationContext;
        const decayedScore = baseScore * features.timeDecayFactor;
        let finalScore = decayedScore;
        const rulesTriggered = [];
        // Rule 1: Immediate life-safety critical override
        if (features.safetyRiskScore >= 90.0 && params.severity === 'CRITICAL') {
            if (finalScore < 85.0) {
                finalScore = 85.0;
                const ruleDesc = 'Life-safety critical override triggered: physical safety hazard >= 90 with CRITICAL severity guarantees P1 tier (score floored to 85.0).';
                rulesTriggered.push(ruleDesc);
                features.reasons.push(ruleDesc);
            }
        }
        // Rule 2: Sensitive institutional zone safety escalation
        const ctx = params.locationContext ?? {};
        const isSensitive = ctx.isHospitalZone || ctx.isSchoolZone;
        if (isSensitive && features.safetyRiskScore >= 65.0) {
            if (finalScore < 70.0) {
                finalScore = 70.0;
                const ruleDesc = 'Institutional zone safety escalation: hazard near hospital/school escalated priority to minimum 70.0.';
                rulesTriggered.push(ruleDesc);
                features.reasons.push(ruleDesc);
            }
        }
        // Rule 3: Starvation prevention for long-overdue issues (>7 days)
        if ((params.ageHours ?? 0.0) >= 168.0) {
            if (finalScore < 60.0) {
                finalScore = 60.0;
                const ruleDesc = 'SLA starvation prevention: unresolved issue older than 7 days floored to P2 tier (60.0) to ensure officer attention.';
                rulesTriggered.push(ruleDesc);
                features.reasons.push(ruleDesc);
            }
        }
        const clampedScore = Number(Math.min(100.0, Math.max(0.0, finalScore)).toFixed(2));
        // Tier mapping
        let tier = 'P4_LOW';
        if (clampedScore >= 80.0) {
            tier = 'P1_CRITICAL';
        }
        else if (clampedScore >= 60.0) {
            tier = 'P2_HIGH';
        }
        else if (clampedScore >= 40.0) {
            tier = 'P3_MEDIUM';
        }
        const slaHours = SLA_TIER_HOURS[tier];
        const decisionEvidence = {
            weights,
            subscores: {
                severity: features.severityScore,
                safetyRisk: features.safetyRiskScore,
                impact: features.impactScore,
                corroboration: features.corroborationScore,
                age: features.ageScore,
                locationContext: features.locationContextScore,
            },
            timeDecayFactor: features.timeDecayFactor,
            baseScore: Number(baseScore.toFixed(2)),
            decayedScore: Number(decayedScore.toFixed(2)),
            finalScore: clampedScore,
            rulesTriggered,
            featureDetails: features.evidence,
        };
        return {
            issueId: params.issueId,
            priorityScore: clampedScore,
            priorityTier: tier,
            recommendedSlaHours: slaHours,
            scoreBreakdown: {
                hazardScore: features.severityScore,
                impactRadiusScore: features.impactScore,
                vulnerabilityScore: features.safetyRiskScore,
                timeDecayFactor: features.timeDecayFactor,
                safetyRiskScore: features.safetyRiskScore,
                impactScore: features.impactScore,
                corroborationScore: features.corroborationScore,
                ageScore: features.ageScore,
                locationContextScore: features.locationContextScore,
            },
            reasons: features.reasons,
            rulesTriggered,
            decisionEvidence,
        };
    }
    /**
     * Optional helper to fetch an issue from the database and calculate priority.
     */
    async calculatePriorityForIssue(issueId, customWeights) {
        const issue = await prisma.issue.findUnique({
            where: { id: issueId },
        });
        if (!issue)
            return null;
        const ageHours = (Date.now() - new Date(issue.createdAt).getTime()) / (1000 * 60 * 60);
        return this.calculatePriority({
            issueId: issue.id,
            title: issue.title,
            description: issue.description,
            category: issue.categoryId ?? 'general_civic',
            severity: issue.severity || 'MEDIUM',
            location: issue.latitude && issue.longitude
                ? {
                    latitude: issue.latitude,
                    longitude: issue.longitude,
                    jurisdictionId: issue.jurisdictionId ?? undefined,
                }
                : undefined,
            ageHours,
        }, customWeights);
    }
}
export const priorityEngine = new PriorityEngine();
