# Phase 33 — Build image relevance/evidence service

**Agent instruction:** Execute Phase 33 only. Do not begin Phase 34.

## Prerequisites
- Phase 32 must be committed/locked before Phase 33 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Implement image relevance classifier for supported civic categories.

## Implementation tasks
- Implement image relevance classifier for supported civic categories.
- Record confidence and uncertainty; low confidence routes to review.
- Document limitations and supported classes.

## Primary files / areas
- `services/ai/app/pipelines/vision/*`
- `docs/ai/model-card-vision.md`

## Exit checks
Evaluation on held-out sample; no unsafe auto-reject.

## Required commit
`feat(phase-33): add vision evidence analysis`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
