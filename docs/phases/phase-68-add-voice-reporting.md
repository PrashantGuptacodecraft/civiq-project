# Phase 68 — Add voice reporting

**Agent instruction:** Execute Phase 68 only. Do not begin Phase 69.

## Prerequisites
- Phase 67 must be committed/locked before Phase 68 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Implement speech-to-text adapter for citizen reports.

## Implementation tasks
- Implement speech-to-text adapter for citizen reports.
- Normalize transcript, keep original audio privacy-safe and optional.
- Add confirmation step before submission.

## Primary files / areas
- `apps/web/features/voice/*`
- `apps/api/src/integrations/speech/*`

## Exit checks
Voice pipeline integration tests with mocked provider.

## Required commit
`feat(phase-68): add voice reporting`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
