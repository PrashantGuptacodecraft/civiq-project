export interface FieldTaskLocation {
  latitude;
  longitude;
  address;
  landmark?;
}

export interface FieldTask {
  id;
  title;
  description;
  categoryId;
  categoryName;
  priority;
  status;
  jurisdictionId;
  jurisdictionName;
  departmentId;
  departmentName;
  assignedWorkerId;
  assignedWorkerName;
  location;
  createdAt;
  dueAt;
  slaHoursRemaining;
  slaStatus: 'WITHIN_SLA' | 'WARNING' | 'BREACHED';
  notes?;
  resolutionNotes?;
  resolvedAt?;
}

export interface FieldWorkerProfile {
  id;
  name;
  role: 'FIELD_WORKER' | 'FIELD_SUPERVISOR';
  jurisdictionId;
  jurisdictionName;
  departmentId;
  departmentName;
  phone?;
}

export interface QueuedMutation {
  id;
  idempotencyKey;
  taskId;
  action: 'START_PROGRESS' | 'UPDATE_NOTES' | 'RESOLVE_TASK';
  payload: {
    status?;
    notes?;
    resolutionNotes?;
  };
  queuedAt;
  retryCount;
}