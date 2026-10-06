# CivIQ Core Sequence Flows

## Normal civic issue

```text
Citizen → Auth → Report API → Evidence checks → AI gateway → Verification gate
→ Department → Worker → Before proof → Repair → After proof → Officer review
→ Citizen verification → Close → Analytics
```

## Emergency incident

```text
Citizen → Auth → Emergency incident
→ immediate official emergency handoff (e.g., call 112)
→ CivIQ status = UNVERIFIED
→ responder/authority confirmation
→ field updates → closure
```

## Disaster event

```text
Official alert adapter → Disaster event → Affected geography
→ Citizen/field impact reports → AI clustering → Situation room
→ Needs/resources/shelters → Task coordination → Ground confirmation
→ After-action review
```
