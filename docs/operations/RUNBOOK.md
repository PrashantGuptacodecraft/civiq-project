# Operations & Release Runbook

## Environments
- local
- development
- staging
- pilot
- production

## Deployment principles
- Infrastructure as code where practical.
- Secrets only through environment/secret manager.
- No production credentials in Git.
- Database backups and restore test.
- Monitoring before public pilot.

## Observability
Every API request and background job should have a correlation/trace ID. Record structured logs with PII redaction.

## Incident response
- detect
- triage
- contain
- recover
- communicate
- post-incident review

## Rollback
Each release must have a rollback plan for web, API, worker and database migrations. Prefer additive migrations first.

## Pilot data
Use synthetic/demo records where official feeds or personal data are unavailable. Clearly label them as demo data.
