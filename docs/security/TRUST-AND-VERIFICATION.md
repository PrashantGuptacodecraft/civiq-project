# Trust, Evidence & Verification Model

## Separate three concepts

### Identity trust
How confidently CivIQ knows who the reporting account is.

Signals may include mobile OTP, email verification, Google identity, passkeys and authorized strong identity providers. Do not treat Google login as proof of legal identity.

### Report confidence
How credible the specific report/evidence appears.

Signals:
- evidence relevance
- image reuse/perceptual similarity
- location consistency
- time consistency
- text consistency
- duplicate/event clustering
- corroboration from independent reports
- user history

### Resolution confidence
Whether the physical issue was actually addressed, supported by field evidence and citizen confirmation.

## Verification states
`SUBMITTED` → `UNDER_VERIFICATION` → `VERIFIED` → `ACTION_IN_PROGRESS` → `RESOLUTION_SUBMITTED` → `CITIZEN_VERIFIED` → `CLOSED`

Alternative states:
- `NEEDS_MORE_EVIDENCE`
- `POSSIBLE_DUPLICATE`
- `REJECTED`
- `REOPENED`
- `UNVERIFIED_EMERGENCY`

## Action gate
Normal issue: automated checks → verifier review when needed → action.

High-impact issue: automated checks → human verification → action.

Emergency issue: immediate safe emergency handoff + CivIQ `UNVERIFIED` incident → responder/authority verification.

## Important rule
AI confidence is not truth. Confidence is a decision-support signal.
