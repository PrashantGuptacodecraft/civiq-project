# Phase 14 — Implement mobile OTP authentication

**Agent instruction:** Execute Phase 14 only. Do not begin Phase 15.

## Prerequisites
- Phase 13 must be committed/locked before Phase 14 may start.
- Read the repository root `AGENTS.md` and `docs/phase-execution.md` before implementing.

## Goal
Implement OTP challenge, expiry, attempt limit, resend cooldown and rate limiting.

## Implementation tasks
- Implement OTP challenge, expiry, attempt limit, resend cooldown and rate limiting.
- Store only safe verification artifacts; do not log OTP values.
- Create session issuance after successful verification.

## Primary files / areas
- `apps/api/src/modules/auth/otp/*`

## Exit checks
Auth integration tests including brute-force and replay cases.

## Required commit
`feat(phase-14): implement mobile OTP auth`

## Stop condition
After the commit, stop and return the commit hash, tests executed, files changed and any unresolved limitations. Do not implement future phases.
