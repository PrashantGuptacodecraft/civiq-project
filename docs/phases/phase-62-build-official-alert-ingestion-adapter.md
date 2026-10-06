# Phase 62 — Build official alert ingestion adapter

**Agent instruction:** Execute Phase 62 only. Do not begin Phase 63.

## Prerequisites
- Phase 61 must be committed/locked before Phase 62 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Implement CAP/RSS-style alert parser and source adapter contract.

## Implementation tasks
- Implement CAP/RSS-style alert parser and source adapter contract.
- Validate source signature/provenance where the source supports it.
- Never rewrite official alert content without clear source labeling.

## Primary files / areas
- `apps/api/src/integrations/alerts/*`
- `apps/worker/src/jobs/alerts/*`

## Exit checks
Parser fixtures, idempotency tests.

## Required commit
`feat(phase-62): add disaster alert ingestion`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
