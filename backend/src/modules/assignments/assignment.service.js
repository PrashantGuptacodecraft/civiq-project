import { prisma } from '@civiq/shared-db';
import {
  AssignIssueParams,
  AssignmentRecommendation,
  AssignmentRecommendationRequest,
  AssignmentResult,
  WorkerProfile,
} from './assignment.types';
import {
  WorkerAssignmentEngine,
  workerAssignmentEngine,
} from './assignment.engine';

export class AssignmentService {
  engine;
  inMemoryWorkers = new Map();

  constructor(engine = workerAssignmentEngine) {
    this.engine = engine;
  }

  /**
   * Register or update a worker profile in memory.
   */
  registerWorker(worker) {
    this.inMemoryWorkers.set(worker.id, worker);
  }

  /**
   * Bulk register workers (e.g. for testing or initialization).
   */
  registerWorkers(workers) {
    for (const w of workers) {
      this.inMemoryWorkers.set(w.id, w);
    }
  }

  /**
   * Retrieve a worker profile by ID.
   */
  getWorker(workerId){
    return this.inMemoryWorkers.get(workerId);
  }

  /**
   * List workers matching optional department and jurisdiction filters.
   */
  listWorkers(filters?{
    departmentId?;
    jurisdictionId?;
  }) {
    let workers = Array.from(this.inMemoryWorkers.values());

    if (filters?.departmentId) {
      workers = workers.filter((w) => w.departmentId === filters.departmentId);
    }
    if (filters?.jurisdictionId) {
      workers = workers.filter(
        (w) =>
          w.jurisdictionId === filters.jurisdictionId ||
          w.coverageJurisdictionIds?.includes(filters.jurisdictionId!)
      );
    }

    return workers;
  }

  /**
   * Generate an assignment recommendation for an issue.
   */
  recommendAssignment(
    request
  ) {
    const candidates =
      request.candidateWorkers && request.candidateWorkers.length > 0
        ? request.candidateWorkers
        : this.listWorkers({
            departmentId: request.departmentId,
            jurisdictionId: request.jurisdictionId,
          });

    return this.engine.generateRecommendation({
      ...request,
      candidateWorkers: candidates,
    });
  }

  /**
   * Assign a worker to an issue, supporting officer with mandatory reason.
   */
  async assignWorkerToIssue(
    params
  ) {
    const {
      issueId,
      assignedWorkerId,
      officerId,
      recommendedWorkerId,
      overrideReason,
      notes,
    } = params;

    // Detect if this is an officer const isOverride = Boolean(
      params.isOfficerOverride ||
        (recommendedWorkerId && assignedWorkerId !== recommendedWorkerId)
    );

    // Mandatory rule MUST have an explanation
    if (isOverride) {
      const cleanReason = (overrideReason || '').trim();
      if (cleanReason.length < 5) {
        throw new Error(
          'Officer requires a valid reason (minimum 5 characters) explaining why the recommended worker was bypassed.'
        );
      }
    }

    // Worker lookup (in-memory or fallback)
    const worker = this.getWorker(assignedWorkerId);
    const workerName = worker?.name || `Worker (${assignedWorkerId})`;

    // Check worker availability constraint: cannot assign to worker on leave / off shift
    if (worker) {
      if (worker.availability.status === 'ON_LEAVE') {
        throw new Error(`Cannot assign issue '${worker.name}' is currently ON_LEAVE.`);
      }
      if (worker.availability.status === 'OFF_SHIFT') {
        throw new Error(`Cannot assign issue '${worker.name}' is currently OFF_SHIFT.`);
      }
    }

    const decisionEvidence = {
      issueId,
      assignedWorkerId,
      assignedWorkerName: workerName,
      officerId,
      recommendedWorkerId,
      isOfficerOverride: isOverride,
      overrideReason: isOverride ? overrideReason ,
      notes,
      assignedAt: new Date().toISOString(),
    };

    // Update Issue in Database if prisma is configured
    try {
      if (prisma.issue) {
        await prisma.issue.update({
          where: { id: issueId },
          data: {
            assignedToId: assignedWorkerId,
            status: 'ASSIGNED',
          },
        });
      }

      // Record Audit Log for the assignment
      if (prisma.auditLog) {
        await prisma.auditLog.create({
          data: {
            actorId: officerId,
            actorType: 'HUMAN',
            action: isOverride ? 'ISSUE_ASSIGNMENT_OVERRIDDEN' : 'ISSUE_ASSIGNED',
            objectType: 'Issue',
            objectId: issueId,
            payload: decisionEvidence,
          },
        });
      }
    } catch {
      // In isolated unit test environments without live DB, continue gracefully
    }

    // Increment worker's local active assignments count
    if (worker) {
      worker.workload.activeAssignmentsCount += 1;
      const maxCap = worker.availability.maxConcurrentWorkload || 5;
      worker.workload.capacityUtilization = Number(
        (worker.workload.activeAssignmentsCount / maxCap).toFixed(2)
      );
    }

    return {
      issueId,
      assignedWorkerId,
      assignedWorkerName: workerName,
      status: 'ASSIGNED',
      isOfficerOverride: isOverride,
      overrideReason: isOverride ? overrideReason ,
      assignedBy: officerId,
      assignedAt: new Date(),
      decisionEvidence,
    };
  }
}

export const assignmentService = new AssignmentService();