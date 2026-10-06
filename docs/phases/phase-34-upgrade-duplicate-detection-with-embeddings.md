# Phase 34 — Upgrade duplicate detection with embeddings

**Agent instruction:** Execute Phase 34 only. Do not begin Phase 35.

## Prerequisites
- Phase 33 must be committed/locked before Phase 34 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Add text embeddings and image embeddings where available.

## Implementation tasks
- Add text embeddings and image embeddings where available.
- Combine with geo/time signals in a transparent ensemble score.
- Store candidate pairs and decision evidence.

## Primary files / areas
- `services/ai/app/pipelines/dedup/*`
- `apps/api/src/modules/duplicates/*`

## Exit checks
Offline evaluation set and threshold report.

## Required commit
`feat(phase-34): add embedding-based deduplication`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
