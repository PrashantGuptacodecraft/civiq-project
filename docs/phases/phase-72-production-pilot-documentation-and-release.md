# Phase 72 — Production pilot, documentation and release

**Agent instruction:** Execute Phase 72 only. Do not begin Phase 73.

## Prerequisites
- Phase 71 must be committed/locked before Phase 72 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Seed a realistic pilot dataset; complete UAT scenarios for every role.

## Implementation tasks
- Seed a realistic pilot dataset; complete UAT scenarios for every role.
- Finalize runbooks, API docs, security checklist, model cards, demo script and project report.
- Deploy the pilot, verify monitoring, create release tag and final architecture snapshot.

## Primary files / areas
- `docs/operations/*`
- `docs/product/*`
- `docs/api/*`
- `docs/ai/*`
- `CHANGELOG.md`

## Exit checks
Full regression, UAT sign-off and production smoke test.

## Required commit
`release(phase-72): publish pilot-ready CivIQ`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
