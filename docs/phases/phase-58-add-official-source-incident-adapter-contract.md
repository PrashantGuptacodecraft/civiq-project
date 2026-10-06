# Phase 58 — Add official-source incident adapter contract

**Agent instruction:** Execute Phase 58 only. Do not begin Phase 59.

## Prerequisites
- Phase 57 must be committed/locked before Phase 58 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Create adapter interface for iRAD/eDAR-like or future official accident feeds.

## Implementation tasks
- Create adapter interface for iRAD/eDAR-like or future official accident feeds.
- Normalize external IDs and provenance.
- Default to mock/sandbox adapter for college deployment.

## Primary files / areas
- `apps/api/src/integrations/incident-source/*`

## Exit checks
Adapter contract tests.

## Required commit
`feat(phase-58): add accident data adapter contract`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
