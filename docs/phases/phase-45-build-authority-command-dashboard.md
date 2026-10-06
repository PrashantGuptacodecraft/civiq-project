# Phase 45 — Build authority command dashboard

**Agent instruction:** Execute Phase 45 only. Do not begin Phase 46.

## Prerequisites
- Phase 44 must be committed/locked before Phase 45 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
KPIs: open, verified, SLA-breached, average resolution, reopened, duplicate rate.

## Implementation tasks
- KPIs: open, verified, SLA-breached, average resolution, reopened, duplicate rate.
- Department/ward filters and drill-down.
- Show data freshness and source labels.

## Primary files / areas
- `apps/web/features/dashboard/*`

## Exit checks
Dashboard data correctness tests.

## Required commit
`feat(phase-45): build command dashboard`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
