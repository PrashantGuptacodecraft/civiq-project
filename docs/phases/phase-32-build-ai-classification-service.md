# Phase 32 — Build AI classification service

**Agent instruction:** Execute Phase 32 only. Do not begin Phase 33.

## Prerequisites
- Phase 31 must be committed/locked before Phase 32 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Implement text classification baseline using a pluggable model/provider.

## Implementation tasks
- Implement text classification baseline using a pluggable model/provider.
- Return category/subcategory confidence and top alternatives.
- Allow human correction to be stored as labeled feedback.

## Primary files / areas
- `services/ai/app/pipelines/classification/*`

## Exit checks
Evaluation fixture set; precision/recall smoke test.

## Required commit
`feat(phase-32): add issue classification`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
