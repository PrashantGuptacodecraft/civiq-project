# Phase 22 — Implement duplicate detection engine v1

**Agent instruction:** Execute Phase 22 only. Do not begin Phase 23.

## Prerequisites
- Phase 21 must be committed/locked before Phase 22 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Combine geo distance, time window and normalized text similarity.

## Implementation tasks
- Combine geo distance, time window and normalized text similarity.
- Return candidate duplicates, similarity explanation and threshold.
- Require human confirmation before merging high-impact cases.

## Primary files / areas
- `apps/api/src/modules/duplicates/*`

## Exit checks
Unit tests with false-positive and false-negative fixtures.

## Required commit
`feat(phase-22): add duplicate detection v1`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
