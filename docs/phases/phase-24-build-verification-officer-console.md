# Phase 24 — Build verification officer console

**Agent instruction:** Execute Phase 24 only. Do not begin Phase 25.

## Prerequisites
- Phase 23 must be committed/locked before Phase 24 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Create queue for pending, suspicious, duplicate and evidence-needed reports.

## Implementation tasks
- Create queue for pending, suspicious, duplicate and evidence-needed reports.
- Show evidence, user trust, location checks, AI recommendations and provenance.
- Add verify/request evidence/reject actions with mandatory reason codes.

## Primary files / areas
- `apps/web/features/verification/*`

## Exit checks
E2E tests for verification workflow.

## Required commit
`feat(phase-24): build verification console`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
