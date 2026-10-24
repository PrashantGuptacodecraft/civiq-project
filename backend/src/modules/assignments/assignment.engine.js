import { workerEligibilityEngine, } from './eligibility.engine.js';
export const DEFAULT_ASSIGNMENT_WEIGHTS = {
    skill: 0.35,
    jurisdiction: 0.20,
    proximity: 0.25,
    workload: 0.20,
};
/**
 * Calculates Haversine distance in kilometers between two GPS coordinates.
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
}
export class WorkerAssignmentEngine {
    eligibilityEngine;
    constructor(eligibilityEngine = workerEligibilityEngine) {
        this.eligibilityEngine = eligibilityEngine;
    }
    /**
     * Deterministic scoring function for a single worker against an issue.
     */
    scoreWorker(worker, request, weights = DEFAULT_ASSIGNMENT_WEIGHTS) {
        const matchReasons = [];
        const resolvedWeights = {
            skill: weights.skill ?? DEFAULT_ASSIGNMENT_WEIGHTS.skill,
            jurisdiction: weights.jurisdiction ?? DEFAULT_ASSIGNMENT_WEIGHTS.jurisdiction,
            proximity: weights.proximity ?? DEFAULT_ASSIGNMENT_WEIGHTS.proximity,
            workload: weights.workload ?? DEFAULT_ASSIGNMENT_WEIGHTS.workload,
        };
        // 1. Eligibility Check
        const eligibility = this.eligibilityEngine.checkWorkerEligibility(worker, {
            categoryId: request.categoryId,
            jurisdictionId: request.jurisdictionId,
            departmentId: request.departmentId,
            severity: request.severity,
        });
        // 2. Skill Score (0 - 100)
        const { skillScore, skillReason } = this.calculateSkillScore(worker.skills, request.categoryId);
        matchReasons.push(skillReason);
        // 3. Jurisdiction & Coverage Score (0 - 100)
        const { jurisdictionScore, jurisdictionReason } = this.calculateJurisdictionScore(worker, request.jurisdictionId);
        matchReasons.push(jurisdictionReason);
        // 4. Proximity Score (0 - 100)
        const { proximityScore, distanceKm, proximityReason } = this.calculateProximityScore(worker, request.location);
        matchReasons.push(proximityReason);
        // 5. Workload Score (0 - 100)
        const { workloadScore, workloadReason } = this.calculateWorkloadScore(worker, request.severity);
        matchReasons.push(workloadReason);
        // Composite Weighted Score
        const rawTotal = skillScore * resolvedWeights.skill +
            jurisdictionScore * resolvedWeights.jurisdiction +
            proximityScore * resolvedWeights.proximity +
            workloadScore * resolvedWeights.workload;
        const totalScore = Number(Math.min(100, Math.max(0, rawTotal)).toFixed(2));
        const breakdown = {
            skillScore,
            jurisdictionScore,
            proximityScore,
            workloadScore,
            distanceKm,
        };
        return {
            worker,
            totalScore,
            scoreBreakdown: breakdown,
            isEligible: eligibility.isEligible,
            ineligibilityReasons: eligibility.reasons,
            matchReasons,
        };
    }
    /**
     * Evaluates all candidate workers, filters ineligible ones, and ranks eligible ones deterministically.
     */
    generateRecommendation(request) {
        const weights = {
            skill: request.customWeights?.skill ?? DEFAULT_ASSIGNMENT_WEIGHTS.skill,
            jurisdiction: request.customWeights?.jurisdiction ?? DEFAULT_ASSIGNMENT_WEIGHTS.jurisdiction,
            proximity: request.customWeights?.proximity ?? DEFAULT_ASSIGNMENT_WEIGHTS.proximity,
            workload: request.customWeights?.workload ?? DEFAULT_ASSIGNMENT_WEIGHTS.workload,
        };
        const candidates = request.candidateWorkers || [];
        const scoredCandidates = candidates.map((w) => this.scoreWorker(w, request, weights));
        const eligibleCandidates = scoredCandidates
            .filter((c) => c.isEligible)
            .sort((a, b) => {
            // Deterministic sort: higher totalScore first; tie-breaker: lower workload then worker id
            if (b.totalScore !== a.totalScore) {
                return b.totalScore - a.totalScore;
            }
            if (a.worker.workload.activeAssignmentsCount !== b.worker.workload.activeAssignmentsCount) {
                return a.worker.workload.activeAssignmentsCount - b.worker.workload.activeAssignmentsCount;
            }
            return a.worker.id.localeCompare(b.worker.id);
        });
        const ineligibleCandidates = scoredCandidates.filter((c) => !c.isEligible);
        const topRecommended = eligibleCandidates[0];
        const decisionEvidence = {
            issueId: request.issueId,
            categoryId: request.categoryId,
            jurisdictionId: request.jurisdictionId,
            departmentId: request.departmentId,
            weights,
            candidatePoolSize: candidates.length,
            eligibleCount: eligibleCandidates.length,
            ineligibleCount: ineligibleCandidates.length,
            topRecommendedId: topRecommended?.worker.id,
            topRecommendedScore: topRecommended?.totalScore,
            scoreBreakdown: topRecommended?.scoreBreakdown,
            topMatchReasons: topRecommended?.matchReasons,
        };
        return {
            issueId: request.issueId,
            recommendedWorker: topRecommended,
            rankedCandidates: eligibleCandidates,
            ineligibleCandidates,
            decisionEvidence,
            generatedAt: new Date(),
        };
    }
    // ─────────────────────────────────────────────
    // Individual Factor Scoring Calculations
    // ─────────────────────────────────────────────
    calculateSkillScore(skills, categoryId) {
        if (!skills || skills.length === 0) {
            return { skillScore: 10, skillReason: 'Skill: No recorded skills for worker (10/100).' };
        }
        const normCat = categoryId.toLowerCase();
        const groupPrefix = normCat.split('_')[0] ?? '';
        // 1. Exact Category Match
        if (skills.some((s) => s.toLowerCase() === normCat)) {
            return {
                skillScore: 100,
                skillReason: `Skill: Exact specialty match for category '${categoryId}' (100/100).`,
            };
        }
        // 2. Wildcard or Group Specialty Match
        if (skills.some((s) => s.toLowerCase() === `${groupPrefix}_*` ||
            s.toLowerCase() === `${groupPrefix}*` ||
            s.toLowerCase() === groupPrefix)) {
            return {
                skillScore: 80,
                skillReason: `Skill: Domain group qualification '${groupPrefix}' matching category '${categoryId}' (80/100).`,
            };
        }
        // 3. Substring / Keyword Match
        if (skills.some((s) => normCat.includes(s.toLowerCase()) || s.toLowerCase().includes(normCat))) {
            return {
                skillScore: 70,
                skillReason: `Skill: Partial keyword competency matching category '${categoryId}' (70/100).`,
            };
        }
        // 4. General civic maintenance fallback
        if (skills.some((s) => s.toLowerCase().includes('general') || s.toLowerCase().includes('maintenance'))) {
            return {
                skillScore: 50,
                skillReason: 'Skill: General municipal field maintenance qualification (50/100).',
            };
        }
        return {
            skillScore: 20,
            skillReason: `Skill: Minimal skill alignment for category '${categoryId}' (20/100).`,
        };
    }
    calculateJurisdictionScore(worker, targetJurisdictionId) {
        if (worker.jurisdictionId === targetJurisdictionId) {
            return {
                jurisdictionScore: 100,
                jurisdictionReason: `Jurisdiction: Primary home jurisdiction match '${targetJurisdictionId}' (100/100).`,
            };
        }
        if (worker.coverageJurisdictionIds?.includes(targetJurisdictionId)) {
            return {
                jurisdictionScore: 85,
                jurisdictionReason: `Jurisdiction: Assigned coverage zone includes target jurisdiction '${targetJurisdictionId}' (85/100).`,
            };
        }
        return {
            jurisdictionScore: 25,
            jurisdictionReason: `Jurisdiction: Outside designated coverage areas for '${targetJurisdictionId}' (25/100).`,
        };
    }
    calculateProximityScore(worker, targetLocation) {
        if (!targetLocation) {
            return {
                proximityScore: 60,
                proximityReason: 'Proximity: Incident GPS unavailable; using neutral baseline score (60/100).',
            };
        }
        const workerLoc = worker.currentLocation || worker.baseLocation;
        if (!workerLoc) {
            return {
                proximityScore: 50,
                proximityReason: 'Proximity: Worker GPS unavailable; using fallback score (50/100).',
            };
        }
        const distanceKm = calculateHaversineDistanceKm(targetLocation.latitude, targetLocation.longitude, workerLoc.latitude, workerLoc.longitude);
        let score = 10;
        if (distanceKm <= 1.0) {
            score = 100;
        }
        else if (distanceKm <= 3.0) {
            score = 90;
        }
        else if (distanceKm <= 5.0) {
            score = 80;
        }
        else if (distanceKm <= 10.0) {
            score = 65;
        }
        else if (distanceKm <= 20.0) {
            score = 45;
        }
        else {
            score = Math.max(10, Math.round(100 - distanceKm * 3));
        }
        const locType = worker.currentLocation ? 'live' : 'base';
        return {
            proximityScore: score,
            distanceKm,
            proximityReason: `Proximity: ${distanceKm} km from incident (${locType} location) (${score}/100).`,
        };
    }
    calculateWorkloadScore(worker, severity) {
        const active = worker.workload.activeAssignmentsCount || 0;
        const maxCapacity = worker.availability.maxConcurrentWorkload || 5;
        const utilization = active / maxCapacity;
        // Linear load balancing: 0 load = 100, full capacity = 0
        let baseScore = Math.max(0, 100 * (1 - utilization));
        // Penalty for pending critical issues if new issue is also high/critical
        const criticals = worker.workload.pendingCriticalCount || 0;
        if (criticals > 0 && (severity === 'CRITICAL' || severity === 'HIGH')) {
            baseScore = Math.max(0, baseScore - criticals * 15);
        }
        const finalScore = Number(baseScore.toFixed(2));
        return {
            workloadScore: finalScore,
            workloadReason: `Workload: ${active}/${maxCapacity} active assignments (${(utilization * 100).toFixed(0)}% utilization) (${finalScore}/100).`,
        };
    }
}
export const workerAssignmentEngine = new WorkerAssignmentEngine();
