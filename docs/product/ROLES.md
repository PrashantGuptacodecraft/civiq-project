# Role & Permission Model

## Platform roles
- `PLATFORM_SUPER_ADMIN` — platform configuration, integrations, security and organizations; cannot silently override audit history.
- `NATIONAL_ADMIN` — national configuration and monitoring.
- `STATE_ADMIN` — state-level configuration and visibility.
- `DISTRICT_ULB_ADMIN` — local authority administration.
- `DEPARTMENT_OFFICER` — departmental verification, assignment, SLA management and closure approval.
- `VERIFICATION_OFFICER` — evidence/report verification.
- `FIELD_SUPERVISOR` — manages field workers and schedules.
- `FIELD_WORKER` — performs field actions and uploads evidence.
- `DISASTER_COORDINATOR` — incident/disaster situation management.
- `AUDITOR` — read-only compliance/audit access.
- `CITIZEN` — own reports, public-safe nearby information, verification and feedback.

## Official onboarding
Government personnel do not self-declare an official role. They are invited/approved by an authorized organization administrator or authorized identity/SSO integration, then use MFA. Store organization, role, jurisdiction, verification method and timestamps.

## Scope
Permissions are scoped by jurisdiction and organization. A Road Department officer for one district cannot act on an unrelated state/district.

## Separation of duties
High-impact workflows can require two-person approval. AI recommendations are never equivalent to authorization.
