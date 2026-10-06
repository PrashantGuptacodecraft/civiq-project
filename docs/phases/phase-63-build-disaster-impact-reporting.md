# Phase 63 — Build disaster impact reporting

**Agent instruction:** Execute Phase 63 only. Do not begin Phase 64.

## Prerequisites
- Phase 62 must be committed/locked before Phase 63 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Citizen/field reports for flooding, blocked roads, utility outage, stranded people, damage and needs.

## Implementation tasks
- Citizen/field reports for flooding, blocked roads, utility outage, stranded people, damage and needs.
- Bind reports to disaster event and geography.
- Use emergency-fast path with unverified status.

## Primary files / areas
- `apps/web/features/disaster-reporting/*`
- `apps/api/src/modules/disaster-impact/*`

## Exit checks
Impact reporting E2E tests.

## Required commit
`feat(phase-63): add disaster impact reporting`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
