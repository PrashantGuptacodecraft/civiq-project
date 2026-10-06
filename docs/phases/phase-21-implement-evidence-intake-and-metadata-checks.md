# Phase 21 — Implement evidence intake and metadata checks

**Agent instruction:** Execute Phase 21 only. Do not begin Phase 22.

## Prerequisites
- Phase 20 must be committed/locked before Phase 21 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Build secure media metadata extraction pipeline.

## Implementation tasks
- Build secure media metadata extraction pipeline.
- Record capture time/location when provided without trusting metadata as proof.
- Add image hash/perceptual hash placeholder contract.

## Primary files / areas
- `apps/api/src/modules/evidence/*`
- `apps/worker/src/jobs/evidence/*`

## Exit checks
Media-security tests, metadata parsing tests.

## Required commit
`feat(phase-21): add evidence processing pipeline`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
