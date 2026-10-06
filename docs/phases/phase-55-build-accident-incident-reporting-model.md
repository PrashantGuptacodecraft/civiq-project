# Phase 55 — Build accident/incident reporting model

**Agent instruction:** Execute Phase 55 only. Do not begin Phase 56.

## Prerequisites
- Phase 54 must be committed/locked before Phase 55 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Create incident entity separate from ordinary civic issues.

## Implementation tasks
- Create incident entity separate from ordinary civic issues.
- Capture location, time, evidence, incident type, possible hazards and status.
- Keep sensitive details protected.

## Primary files / areas
- `apps/api/src/modules/incidents/*`

## Exit checks
Incident model/API tests.

## Required commit
`feat(phase-55): add incident model`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
