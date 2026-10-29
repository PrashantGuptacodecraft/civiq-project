# CivIQ Public Safety Communications Policy

**Document ID:** `POL-OPS-COMM-001`  
**Effective Date:** 29 October 2026  
**Governing ADR:** [ADR 0002: Safety Boundaries and System Scope](../adr/0002-safety-boundaries.md)  
**Applicable Scope:** All municipal and district public safety announcements, in-app banners, push alerts, and portal broadcasts generated via CivIQ.

---

## 1. Purpose & Statutory Boundaries

CivIQ operates as a municipal intelligence, operational coordination, and civic notification platform. **CivIQ is not an official statutory emergency dispatch center (CAD), nor does it replace the National Emergency Response Support System (ERSS - Call 112), SACHET (National Disaster Alert Platform), or State Police control rooms.**

### Core Statutory Mandates
1. **Never Replace Official 112:** Any message concerning an active, life-threatening emergency must direct citizens to immediately contact official helplines (Call 112).
2. **Authoritative Sources Take Precedence:** Official alerts and feeds from government agencies (MoRTH, State Traffic Police, District Disaster Management Authority, IMD) remain the authoritative source of truth.
3. **No Unilateral Panic Invocations:** All warnings must provide clear, actionable, verified instructions rather than sensationalized alerts.

---

## 2. Approved Communication Types

CivIQ communications are strictly partitioned into three distinct types:

| Communication Type | Definition | Verification Requirement |
|---|---|---|
| `VERIFIED_ISSUE_ALERT` | Alerts regarding confirmed physical civic hazards (e.g. fallen high-voltage cables, major road cave-ins, watermain bursts, toxic spills). | Must be verified by field verification staff, ULB engineer, or designated department officer. |
| `INCIDENT_UPDATE` | Operational traffic corridor advisories, lane blockages, emergency vehicle access corridors, and scene clearance notices. | Must originate from on-scene traffic police, municipal patrol, or authorized first responders. |
| `OFFICIAL_SOURCE_NOTICE` | Direct advisories issued by statutory authorities (e.g. IMD weather alerts, DDMA flood warnings, Police traffic divergence orders). | Ingested via authenticated official feeds with cryptographic provenance or entered by authorized agency dispatchers. |

---

## 3. Mandatory Emergency Disclaimer & Handoff

Every public safety alert, push notification, and portal notice emitted by CivIQ **MUST** include the statutory emergency handoff and disclaimer:

> **Emergency Notice:**  
> *For active life-threatening emergencies, medical distress, or severe road accidents, call 112 immediately. CivIQ is a civic information and coordination platform, not an emergency response command centre. Do not wait for in-app updates during an active emergency.*

### Standard Helpline Contacts Included:
- **National Emergency Number:** `112`
- **Police Emergency:** `100`
- **Fire & Rescue:** `101`
- **Medical EMS (Ambulance):** `108`
- **District Disaster Management Cell:** `1077`

---

## 4. AI Governance: Human-in-the-Loop Review Policy

### The Cardinal Rule
> **Unreviewed AI text shall never be published or broadcast as an official public warning.**

To prevent hallucination, premature alarm, or misleading safety guidance:
1. **Initial State:** Any communication draft synthesized, summarized, or proposed by an AI model (LLM, vision analysis, or predictive pipeline) is permanently tagged with:
   - `isAiDraft: true`
   - `reviewStatus: 'AI_DRAFT_PENDING_REVIEW'`
2. **Publish Block:** The publication engine strictly enforces an automated safety gate. Calling `publishAlert()` on any alert with `AI_DRAFT_PENDING_REVIEW` triggers an immediate `UnreviewedAIWarningError` (`403 Forbidden`).
3. **Authorized Approvers:** An alert containing AI content can only transition to `APPROVED_BY_OFFICIAL` through explicit review and sign-off by a qualified human official with one of the following roles:
   - `DISASTER_COORDINATOR`
   - `DISTRICT_ULB_ADMIN`
   - `AGENCY_ADMIN`
   - `PLATFORM_SUPER_ADMIN`
   - `EMERGENCY_DISPATCHER`
4. **Accountability & Audit Logging:** The review event immutably logs the approver's identifier, badge number, timestamp, and any human edits applied to the copy.

---

## 5. Pre-Approved Template System

To facilitate rapid, reliable communication during critical incidents without incurring AI review delays, CivIQ maintains a **Pre-Approved Template Catalog**.

- **Pre-Approved Templates** (`tpl-verified-hazard-alert`, `tpl-traffic-corridor-detour`, `tpl-incident-cleared-notice`, `tpl-official-weather-hazard`) are pre-vetted by municipal legal and safety officers.
- They enforce strict variable interpolation (`{{locationName}}`, `{{precautionAction}}`, `{{alternateRoute}}`).
- HTML tags and template injection characters are sanitized upon rendering.
- Pre-approved templates carry `reviewStatus: 'PRE_APPROVED_TEMPLATE'` and may be published immediately by authorized duty dispatchers.

---

## 6. Incident Update Lifecycle

1. **Issued:** Incident confirmed, initial safety warning broadcast with detour/precaution advice.
2. **Operational Progress:** Secondary updates reflecting corridor clearance, tow truck arrival, or green corridor activation.
3. **Cleared:** Mandatory resolution notice (`tpl-incident-cleared-notice`) informing the public that the hazard is mitigated and normal transit has resumed.
4. **Revocation / Expiry:** All published alerts automatically transition to `EXPIRED` after their designated lifespan or `REVOKED` if superseded.
