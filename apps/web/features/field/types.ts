export type FieldTaskStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';

export type FieldTaskPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface FieldTaskLocation {
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string | undefined;
}

export interface FieldTask {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  priority: FieldTaskPriority;
  status: FieldTaskStatus;
  jurisdictionId: string;
  jurisdictionName: string;
  departmentId: string;
  departmentName: string;
  assignedWorkerId: string;
  assignedWorkerName: string;
  location: FieldTaskLocation;
  createdAt: string;
  dueAt: string;
  slaHoursRemaining: number;
  slaStatus: 'WITHIN_SLA' | 'WARNING' | 'BREACHED';
  notes?: string | undefined;
  resolutionNotes?: string | undefined;
  resolvedAt?: string | undefined;
}

export interface FieldWorkerProfile {
  id: string;
  name: string;
  role: 'FIELD_WORKER' | 'FIELD_SUPERVISOR';
  jurisdictionId: string;
  jurisdictionName: string;
  departmentId: string;
  departmentName: string;
  phone?: string | undefined;
}

export interface QueuedMutation {
  id: string;
  idempotencyKey: string;
  taskId: string;
  action: 'START_PROGRESS' | 'UPDATE_NOTES' | 'RESOLVE_TASK';
  payload: {
    status?: FieldTaskStatus | undefined;
    notes?: string | undefined;
    resolutionNotes?: string | undefined;
  };
  queuedAt: string;
  retryCount: number;
}
