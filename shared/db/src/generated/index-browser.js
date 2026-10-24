
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  phone: 'phone',
  role: 'role',
  status: 'status',
  verificationLevel: 'verificationLevel',
  emailVerifiedAt: 'emailVerifiedAt',
  phoneVerifiedAt: 'phoneVerifiedAt',
  termsAcceptedAt: 'termsAcceptedAt',
  privacyPolicyAcceptedAt: 'privacyPolicyAcceptedAt',
  passwordHash: 'passwordHash',
  failedLoginAttempts: 'failedLoginAttempts',
  lockedUntil: 'lockedUntil',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  version: 'version'
};

exports.Prisma.OAuthAccountScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  provider: 'provider',
  providerAccountId: 'providerAccountId',
  createdAt: 'createdAt'
};

exports.Prisma.UserProfileScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  displayName: 'displayName',
  avatarUrl: 'avatarUrl',
  bio: 'bio',
  state: 'state',
  district: 'district',
  city: 'city',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PrivacyPreferenceScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  showRealName: 'showRealName',
  shareLocation: 'shareLocation',
  allowContact: 'allowContact',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TrustProfileScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  trustScore: 'trustScore',
  trustLevel: 'trustLevel',
  validReports: 'validReports',
  rejectedReports: 'rejectedReports',
  confirmedAbuse: 'confirmedAbuse',
  lastRecalculatedAt: 'lastRecalculatedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OtpChallengeScalarFieldEnum = {
  id: 'id',
  phone: 'phone',
  otpHash: 'otpHash',
  attempts: 'attempts',
  expiresAt: 'expiresAt',
  verifiedAt: 'verifiedAt',
  createdAt: 'createdAt'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  tokenHash: 'tokenHash',
  deviceInfo: 'deviceInfo',
  ipAddress: 'ipAddress',
  isRevoked: 'isRevoked',
  authenticatedAt: 'authenticatedAt',
  lastActiveAt: 'lastActiveAt',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PasswordResetTokenScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  tokenHash: 'tokenHash',
  expiresAt: 'expiresAt',
  usedAt: 'usedAt',
  createdAt: 'createdAt'
};

exports.Prisma.IssueScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  status: 'status',
  severity: 'severity',
  verificationStatus: 'verificationStatus',
  latitude: 'latitude',
  longitude: 'longitude',
  address: 'address',
  state: 'state',
  district: 'district',
  city: 'city',
  categoryId: 'categoryId',
  jurisdictionId: 'jurisdictionId',
  source: 'source',
  reportedById: 'reportedById',
  assignedToId: 'assignedToId',
  resolverVersion: 'resolverVersion',
  resolverSource: 'resolverSource',
  isBoundaryAmbiguous: 'isBoundaryAmbiguous',
  manualJurisdictionConfirmed: 'manualJurisdictionConfirmed',
  version: 'version',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.VerificationHistoryScalarFieldEnum = {
  id: 'id',
  issueId: 'issueId',
  previousStatus: 'previousStatus',
  newStatus: 'newStatus',
  changedById: 'changedById',
  reason: 'reason',
  createdAt: 'createdAt'
};

exports.Prisma.IssueEvidenceScalarFieldEnum = {
  id: 'id',
  issueId: 'issueId',
  storageKey: 'storageKey',
  mimeType: 'mimeType',
  sizeBytes: 'sizeBytes',
  fileHash: 'fileHash',
  perceptualHash: 'perceptualHash',
  captureLatitude: 'captureLatitude',
  captureLongitude: 'captureLongitude',
  metadataTrusted: 'metadataTrusted',
  scanStatus: 'scanStatus',
  quarantineReason: 'quarantineReason',
  uploadedById: 'uploadedById',
  capturedAt: 'capturedAt',
  createdAt: 'createdAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  actorId: 'actorId',
  actorType: 'actorType',
  action: 'action',
  objectType: 'objectType',
  objectId: 'objectId',
  jurisdictionId: 'jurisdictionId',
  requestId: 'requestId',
  payload: 'payload',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  createdAt: 'createdAt'
};

exports.Prisma.AiAuditRecordScalarFieldEnum = {
  id: 'id',
  operation: 'operation',
  issueId: 'issueId',
  traceId: 'traceId',
  modelName: 'modelName',
  modelVersion: 'modelVersion',
  promptConfigHash: 'promptConfigHash',
  confidence: 'confidence',
  inferenceOutput: 'inferenceOutput',
  rawInputRedacted: 'rawInputRedacted',
  isRedacted: 'isRedacted',
  humanDecision: 'humanDecision',
  humanDecisionNotes: 'humanDecisionNotes',
  humanDecisionBy: 'humanDecisionBy',
  humanDecidedAt: 'humanDecidedAt',
  overrideReason: 'overrideReason',
  finalOutcome: 'finalOutcome',
  evaluationMetrics: 'evaluationMetrics',
  latencyMs: 'latencyMs',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.JurisdictionScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  lgdCode: 'lgdCode',
  parentId: 'parentId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  version: 'version'
};

exports.Prisma.JurisdictionBoundaryScalarFieldEnum = {
  id: 'id',
  jurisdictionId: 'jurisdictionId',
  boundaryType: 'boundaryType',
  coordinatesJson: 'coordinatesJson',
  minLat: 'minLat',
  maxLat: 'maxLat',
  minLng: 'minLng',
  maxLng: 'maxLng',
  bufferMeters: 'bufferMeters',
  source: 'source',
  version: 'version',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OrganizationScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  verificationStatus: 'verificationStatus',
  jurisdictionId: 'jurisdictionId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  version: 'version'
};

exports.Prisma.DepartmentScalarFieldEnum = {
  id: 'id',
  name: 'name',
  organizationId: 'organizationId',
  issueCategories: 'issueCategories',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.RoleAssignmentScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  role: 'role',
  jurisdictionId: 'jurisdictionId',
  organizationId: 'organizationId',
  departmentId: 'departmentId',
  createdAt: 'createdAt'
};

exports.Prisma.OfficialInviteScalarFieldEnum = {
  id: 'id',
  email: 'email',
  employeeIdentifier: 'employeeIdentifier',
  role: 'role',
  tokenHash: 'tokenHash',
  status: 'status',
  expiresAt: 'expiresAt',
  organizationId: 'organizationId',
  departmentId: 'departmentId',
  invitedById: 'invitedById',
  acceptedById: 'acceptedById',
  acceptedAt: 'acceptedAt',
  createdAt: 'createdAt'
};

exports.Prisma.IntegrationSourceScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  isActive: 'isActive',
  confidence: 'confidence',
  syncCursor: 'syncCursor',
  lastSyncAt: 'lastSyncAt',
  lastSuccessAt: 'lastSuccessAt',
  errorState: 'errorState',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ExternalReferenceScalarFieldEnum = {
  id: 'id',
  integrationId: 'integrationId',
  objectType: 'objectType',
  objectId: 'objectId',
  externalId: 'externalId',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RiskSignalScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  issueId: 'issueId',
  ipAddress: 'ipAddress',
  deviceInfo: 'deviceInfo',
  fileHash: 'fileHash',
  signalType: 'signalType',
  severity: 'severity',
  decision: 'decision',
  metadata: 'metadata',
  createdAt: 'createdAt',
  reviewedAt: 'reviewedAt',
  reviewedById: 'reviewedById'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  issueId: 'issueId',
  channel: 'channel',
  title: 'title',
  message: 'message',
  status: 'status',
  idempotencyKey: 'idempotencyKey',
  metadata: 'metadata',
  readAt: 'readAt',
  sentAt: 'sentAt',
  failedAt: 'failedAt',
  failureReason: 'failureReason',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.Role = exports.$Enums.Role = {
  PLATFORM_SUPER_ADMIN: 'PLATFORM_SUPER_ADMIN',
  NATIONAL_ADMIN: 'NATIONAL_ADMIN',
  STATE_ADMIN: 'STATE_ADMIN',
  DISTRICT_ULB_ADMIN: 'DISTRICT_ULB_ADMIN',
  DEPARTMENT_OFFICER: 'DEPARTMENT_OFFICER',
  VERIFICATION_OFFICER: 'VERIFICATION_OFFICER',
  FIELD_SUPERVISOR: 'FIELD_SUPERVISOR',
  FIELD_WORKER: 'FIELD_WORKER',
  DISASTER_COORDINATOR: 'DISASTER_COORDINATOR',
  AUDITOR: 'AUDITOR',
  CITIZEN: 'CITIZEN'
};

exports.AccountStatus = exports.$Enums.AccountStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  DEACTIVATED: 'DEACTIVATED',
  BANNED: 'BANNED'
};

exports.UserVerificationLevel = exports.$Enums.UserVerificationLevel = {
  UNVERIFIED: 'UNVERIFIED',
  BASIC_VERIFIED: 'BASIC_VERIFIED',
  KYC_VERIFIED: 'KYC_VERIFIED'
};

exports.TrustLevel = exports.$Enums.TrustLevel = {
  NEW: 'NEW',
  ESTABLISHED: 'ESTABLISHED',
  TRUSTED: 'TRUSTED',
  FLAGGED: 'FLAGGED',
  SUSPENDED: 'SUSPENDED'
};

exports.IssueStatus = exports.$Enums.IssueStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  REOPENED: 'REOPENED'
};

exports.IssueSeverity = exports.$Enums.IssueSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

exports.VerificationStatus = exports.$Enums.VerificationStatus = {
  PENDING: 'PENDING',
  IN_REVIEW: 'IN_REVIEW',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  SUSPICIOUS: 'SUSPICIOUS',
  NEEDS_EVIDENCE: 'NEEDS_EVIDENCE',
  DUPLICATE: 'DUPLICATE'
};

exports.MediaScanStatus = exports.$Enums.MediaScanStatus = {
  PENDING_SCAN: 'PENDING_SCAN',
  CLEAN: 'CLEAN',
  QUARANTINED: 'QUARANTINED'
};

exports.AiOperationType = exports.$Enums.AiOperationType = {
  CLASSIFICATION: 'CLASSIFICATION',
  EVIDENCE_VERIFICATION: 'EVIDENCE_VERIFICATION',
  DUPLICATE_DETECTION: 'DUPLICATE_DETECTION',
  PRIORITY_SCORING: 'PRIORITY_SCORING',
  DEPARTMENT_ROUTING: 'DEPARTMENT_ROUTING',
  SUMMARIZATION: 'SUMMARIZATION',
  INCIDENT_PREDICTION: 'INCIDENT_PREDICTION'
};

exports.AiHumanDecision = exports.$Enums.AiHumanDecision = {
  ACCEPTED: 'ACCEPTED',
  MODIFIED: 'MODIFIED',
  OVERRIDDEN: 'OVERRIDDEN',
  REJECTED: 'REJECTED',
  PENDING_REVIEW: 'PENDING_REVIEW'
};

exports.JurisdictionType = exports.$Enums.JurisdictionType = {
  COUNTRY: 'COUNTRY',
  STATE_UT: 'STATE_UT',
  DISTRICT: 'DISTRICT',
  LOCAL_BODY: 'LOCAL_BODY',
  BLOCK: 'BLOCK',
  WARD_VILLAGE: 'WARD_VILLAGE'
};

exports.OrganizationType = exports.$Enums.OrganizationType = {
  GOVERNMENT: 'GOVERNMENT',
  NGO: 'NGO',
  CONTRACTOR: 'CONTRACTOR',
  CIVIC_GROUP: 'CIVIC_GROUP'
};

exports.OrgVerificationStatus = exports.$Enums.OrgVerificationStatus = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED'
};

exports.InviteStatus = exports.$Enums.InviteStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REVOKED: 'REVOKED',
  EXPIRED: 'EXPIRED'
};

exports.IntegrationType = exports.$Enums.IntegrationType = {
  GOVERNMENT_API: 'GOVERNMENT_API',
  SENSOR_NETWORK: 'SENSOR_NETWORK',
  SCRAPER: 'SCRAPER',
  MANUAL_IMPORT: 'MANUAL_IMPORT',
  THIRD_PARTY_SERVICE: 'THIRD_PARTY_SERVICE'
};

exports.SignalType = exports.$Enums.SignalType = {
  BURST_REPORTING: 'BURST_REPORTING',
  REPEATED_MEDIA: 'REPEATED_MEDIA',
  API_ABUSE: 'API_ABUSE',
  SUSPICIOUS_DEVICE: 'SUSPICIOUS_DEVICE'
};

exports.ReviewDecision = exports.$Enums.ReviewDecision = {
  PENDING: 'PENDING',
  DISMISSED: 'DISMISSED',
  ACTIONED: 'ACTIONED'
};

exports.NotificationChannel = exports.$Enums.NotificationChannel = {
  IN_APP: 'IN_APP',
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  PUSH: 'PUSH'
};

exports.NotificationStatus = exports.$Enums.NotificationStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
  READ: 'READ'
};

exports.Prisma.ModelName = {
  User: 'User',
  OAuthAccount: 'OAuthAccount',
  UserProfile: 'UserProfile',
  PrivacyPreference: 'PrivacyPreference',
  TrustProfile: 'TrustProfile',
  OtpChallenge: 'OtpChallenge',
  Session: 'Session',
  PasswordResetToken: 'PasswordResetToken',
  Issue: 'Issue',
  VerificationHistory: 'VerificationHistory',
  IssueEvidence: 'IssueEvidence',
  AuditLog: 'AuditLog',
  AiAuditRecord: 'AiAuditRecord',
  Jurisdiction: 'Jurisdiction',
  JurisdictionBoundary: 'JurisdictionBoundary',
  Organization: 'Organization',
  Department: 'Department',
  RoleAssignment: 'RoleAssignment',
  OfficialInvite: 'OfficialInvite',
  IntegrationSource: 'IntegrationSource',
  ExternalReference: 'ExternalReference',
  RiskSignal: 'RiskSignal',
  Notification: 'Notification'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
