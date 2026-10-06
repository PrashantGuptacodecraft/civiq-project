# API Contract Baseline

## Core resource families
- `/auth/*`
- `/users/*`
- `/organizations/*`
- `/jurisdictions/*`
- `/issues/*`
- `/incidents/*`
- `/verification/*`
- `/assignments/*`
- `/sla/*`
- `/assets/*`
- `/disasters/*`
- `/resources/*`
- `/notifications/*`
- `/analytics/*`
- `/integrations/*`
- `/audit/*`

## Common write requirements
- authentication required
- authorization policy
- input validation
- idempotency for externally-triggered create operations
- audit event on privileged mutation
- structured errors
- request ID / trace ID

## Status history
Never rely only on a mutable status field for audit-critical workflows. Persist an immutable status/event history.

## Integration adapters
Adapters should isolate external schemas/providers from the core domain. Examples: SACHET/CAP-RSS, IUDX, Open311, data.gov.in, official 112 handoff, identity/SSO and BHASHINI.
