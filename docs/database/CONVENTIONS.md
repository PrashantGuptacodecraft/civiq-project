# Database Conventions

## Naming
- PostgreSQL snake_case at SQL level; Prisma naming strategy must be consistent.
- Tables represent business concepts, not UI screens.

## Core entities
`User`, `AuthIdentity`, `Session`, `Organization`, `Department`, `Jurisdiction`, `Role`, `Permission`, `Issue`, `IssueMedia`, `IssueStatusHistory`, `ReportVerification`, `DuplicateCandidate`, `Assignment`, `SlaRule`, `Escalation`, `Asset`, `MaintenanceRecord`, `Incident`, `DisasterEvent`, `DisasterAlert`, `Resource`, `ResourceRequest`, `Notification`, `AuditLog`, `AiResult`.

## Required invariants
- report has an accountable submitter
- jurisdiction is resolved from coordinates or explicitly confirmed
- high-impact status transitions are audited
- no hard delete for audit-critical records
- private media requires authorization checks
