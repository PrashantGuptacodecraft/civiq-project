# Phase Status

**Repository bootstrap state:** Phase 00 / documentation baseline only.

**Next authorized phase:** Phase 01.

The agent must update this file only when a phase explicitly requires it. The Git commit history is the authoritative implementation history.

## Phase state values

- `LOCKED` — completed and committed; do not rework unless a later phase explicitly changes a contract.
- `NEXT` — the next phase authorized by the project owner.
- `PLANNED` — future work not yet authorized.
- `BLOCKED` — cannot proceed because an explicit dependency is unresolved.
