import { WorkerProfile } from './assignment.types';

export interface EligibilityIssueContext {
  categoryId: string;
  jurisdictionId: string;
  departmentId?: string | undefined;
  severity: string;
}

export interface WorkerEligibilityResult {
  isEligible: boolean;
  reasons: string[];
}

export class WorkerEligibilityEngine {
  /**
   * Evaluates hard constraints to determine if a worker is eligible for assignment.
   * Hard constraints:
   * 1. Availability status (must be AVAILABLE or ON_DUTY).
   * 2. Workload capacity (active assignments < maxConcurrentWorkload).
   * 3. Department matching (if issue is routed to a department, worker must belong to it).
   * 4. Jurisdiction coverage (issue jurisdiction must be within worker's coverage areas).
   * 5. Skill alignment (worker must have domain skill or category capability).
   */
  public checkWorkerEligibility(
    worker: WorkerProfile,
    issue: EligibilityIssueContext
  ): WorkerEligibilityResult {
    const reasons: string[] = [];

    // 1. Availability Status
    const availStatus = worker.availability.status;
    if (availStatus === 'ON_LEAVE') {
      reasons.push('Worker is currently ON_LEAVE.');
    } else if (availStatus === 'OFF_SHIFT') {
      reasons.push('Worker is currently OFF_SHIFT.');
    } else if (availStatus === 'BUSY' && worker.workload.activeAssignmentsCount >= worker.availability.maxConcurrentWorkload) {
      reasons.push('Worker is marked BUSY and has no remaining capacity.');
    }

    // 2. Workload Capacity
    const active = worker.workload.activeAssignmentsCount;
    const maxCapacity = worker.availability.maxConcurrentWorkload || 5;
    if (active >= maxCapacity) {
      reasons.push(
        `Worker has reached maximum concurrent workload capacity (${active}/${maxCapacity}).`
      );
    }

    // 3. Department Isolation
    if (issue.departmentId && worker.departmentId !== issue.departmentId) {
      reasons.push(
        `Department mismatch: Worker belongs to '${worker.departmentId}', but issue is routed to '${issue.departmentId}'.`
      );
    }

    // 4. Jurisdiction & Coverage
    const isDirectJurisdictionMatch = worker.jurisdictionId === issue.jurisdictionId;
    const isCoverageMatch = worker.coverageJurisdictionIds?.includes(issue.jurisdictionId);

    if (!isDirectJurisdictionMatch && !isCoverageMatch) {
      reasons.push(
        `Jurisdiction mismatch: Issue jurisdiction '${issue.jurisdictionId}' is outside worker's assigned jurisdiction ('${worker.jurisdictionId}') and coverage areas.`
      );
    }

    // 5. Skill Capability
    const hasSkill = this.hasCategorySkill(worker.skills, issue.categoryId);
    if (!hasSkill) {
      reasons.push(
        `Skill mismatch: Worker lacks necessary skill qualification for category '${issue.categoryId}'.`
      );
    }

    return {
      isEligible: reasons.length === 0,
      reasons,
    };
  }

  /**
   * Determine if worker's skills match the civic issue category.
   */
  public hasCategorySkill(workerSkills: string[], categoryId: string): boolean {
    if (!workerSkills || workerSkills.length === 0) {
      return false;
    }

    const normCat = categoryId.toLowerCase();
    const groupPrefix = normCat.split('_')[0] ?? '';

    return workerSkills.some((s) => {
      const normSkill = s.toLowerCase();
      // Exact category match
      if (normSkill === normCat) return true;
      // Wildcard match (e.g. "roads_*" or "roads*")
      if (normSkill === `${groupPrefix}_*` || normSkill === `${groupPrefix}*`) return true;
      // Group name match (e.g. "roads" for "roads_pothole")
      if (normSkill === groupPrefix) return true;
      // Substring keyword match (e.g. "pothole" in "roads_pothole")
      if (normCat.includes(normSkill) || normSkill.includes(normCat)) return true;
      // Universal field maintenance skill
      if (normSkill === 'general_civic_maintenance' || normSkill === 'general_field_worker') return true;
      return false;
    });
  }
}

export const workerEligibilityEngine = new WorkerEligibilityEngine();
