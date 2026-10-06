# CivIQ Agent Instructions

You are working inside the CivIQ repository. This file is mandatory reading before changing code.

## Phase-gated execution

The user will normally provide only a phase number, for example:

- `Execute Phase 07`
- `Phase 32`
- `Implement phase 55`

Interpret that as permission to execute **only that phase**.

### Mandatory procedure

1. Read `docs/PHASE_STATUS.md`.
2. Read `docs/phase-execution.md`.
3. Read the requested `docs/phases/phase-XX-*.md`.
4. Read the prerequisite phase docs and any architecture/security/AI docs referenced by the phase.
5. Inspect the current repository state before editing.
6. Implement only the requested phase.
7. Do not silently pull future-phase functionality into the current phase.
8. Preserve existing working behavior. Prefer additive changes.
9. Run the exit checks listed in the phase document plus relevant existing tests.
10. Update documentation/status only when that phase explicitly requires it.
11. Create the exact required commit message from the phase document.
12. Stop after the commit.

## Never do this

- Do not implement the next phase automatically.
- Do not redesign the architecture because a different approach seems cleaner.
- Do not add a new dependency without checking existing conventions and documenting the reason.
- Do not make AI decisions the final authority for emergency/high-impact actions.
- Do not store raw Aadhaar numbers or other unnecessary identity data.
- Do not expose citizen PII or accident evidence publicly by default.
- Do not claim a government integration is live unless credentials and a real authorized endpoint exist.
- Do not use mocked integrations in production paths without explicit feature flags/source labels.

## Required completion report

After the commit, report only:

- Phase completed
- Commit hash
- Files changed
- Tests/checks executed and result
- Unresolved limitations / follow-ups

Then stop.
