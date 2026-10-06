# Phase 28 — Add secure media storage

**Agent instruction:** Execute Phase 28 only. Do not begin Phase 29.

## Prerequisites
- Phase 27 must be committed/locked before Phase 28 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Use object storage with private-by-default media.

## Implementation tasks
- Use object storage with private-by-default media.
- Generate signed upload/download URLs.
- Validate type/size and quarantine unsafe content.

## Primary files / areas
- `apps/api/src/modules/media/*`
- `apps/worker/src/jobs/media/*`

## Exit checks
Upload security tests.

## Required commit
`feat(phase-28): add secure media storage`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
