# Phase 26 — Implement issue creation API

**Agent instruction:** Execute Phase 26 only. Do not begin Phase 27.

## Prerequisites
- Phase 25 must be committed/locked before Phase 26 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Create issue with description, category, jurisdiction, location and source.

## Implementation tasks
- Create issue with description, category, jurisdiction, location and source.
- Require authenticated user for public submission.
- Return immutable issue ID and submission status.

## Primary files / areas
- `apps/api/src/modules/issues/*`

## Exit checks
API integration tests and validation tests.

## Required commit
`feat(phase-26): add civic issue API`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
