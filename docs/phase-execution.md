# Phase Execution Protocol

## Purpose

CivIQ is developed in small, reviewable milestones. Every phase must result in one coherent Git commit.

## Standard agent loop

```text
User: Phase XX
      ↓
Read status + phase spec + dependencies
      ↓
Inspect repo
      ↓
Implement only Phase XX
      ↓
Run tests / lint / typecheck / security checks required for Phase XX
      ↓
Review diff for scope creep
      ↓
Commit with required message
      ↓
STOP
```

## Scope rule

If implementation discovers a requirement belonging to another phase:

1. Do not implement it now.
2. Record it as a limitation or follow-up.
3. Continue only if the current phase can be completed without violating its contract.

## Emergency rule

For emergency/disaster workflows, the system must support an immediate safe handoff to the appropriate official emergency channel while maintaining an `UNVERIFIED` CivIQ incident record. AI verification must not become a safety-critical blocking dependency.

## Definition of done

A phase is done only when its phase-specific exit checks pass, the required commit exists, and no future phase has been silently implemented.
