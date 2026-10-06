# Phase 31 — Create AI gateway contract

**Agent instruction:** Execute Phase 31 only. Do not begin Phase 32.

## Prerequisites
- Phase 30 must be committed/locked before Phase 31 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Define versioned AI operations: classify, evidence-check, duplicate-score, priority-score, route, summarize, predict.

## Implementation tasks
- Define versioned AI operations: classify, evidence-check, duplicate-score, priority-score, route, summarize, predict.
- Create provider-agnostic request/response schemas.
- Return confidence, model/version, explanations and latency.

## Primary files / areas
- `services/ai/app/api/*`
- `packages/contracts/ai/*`

## Exit checks
Contract tests and schema validation.

## Required commit
`feat(phase-31): add AI gateway contract`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
