# CivIQ Product Requirements Document

## Product
**CivIQ — AI-Assisted Civic, Incident & Disaster Intelligence Platform**

## Core promise
**Identity → Evidence → Verification → Action → Proof → Learning**

## Problem
Existing civic and emergency ecosystems already provide reporting, grievance handling and official alerts. CivIQ focuses on the operational gap between receiving information and producing a trustworthy, accountable, verifiable action.

## Primary personas
- Citizen / resident
- Verification officer
- Department officer
- Field supervisor
- Field worker
- Disaster/emergency coordinator
- District/ULB/state platform administrator
- CivIQ platform administrator
- Auditor

## Core capabilities
1. Authenticated reporting via mobile OTP, Google/email paths, and optional stronger identity verification.
2. Civic issues: roads, potholes, streetlights, garbage, water, drainage and other infrastructure/service issues.
3. Incidents: accidents and public-safety/infrastructure incidents.
4. Disaster events: impact reporting, resource/shelter coordination, official alert ingestion and situation-room operations.
5. Trust & verification: identity trust is separated from report confidence.
6. AI intelligence: classification, evidence relevance, duplicate detection, explainable priority recommendation, routing recommendation, resolution prediction, recurring-issue detection and summarization.
7. Field operations: assignment, navigation, before/after evidence, timestamps, GPS and offline sync.
8. Citizen verification and appeals/reopening.
9. Asset registry and maintenance intelligence.
10. Analytics, hotspot detection and after-action reporting.

## Boundaries
- CivIQ does not replace 112, SACHET, CPGRAMS, iRAD/eDAR, official disaster authorities or municipal systems.
- Official alerts remain authoritative.
- AI does not autonomously make high-impact or life-critical decisions.
- Emergency reports use a fast path and can be marked `UNVERIFIED` while triggering an official emergency handoff.
- No anonymous public reporting.
- Production government authentication/integrations must be authorized; development uses clearly labelled adapters/mocks.

## Pilot vs national readiness
The architecture is national-ready: India → State/UT → District → Local Body/Panchayat → Ward/Village → Geo Point. The college deployment should use a bounded pilot jurisdiction plus synthetic/mock data for unavailable official feeds.

## Product KPIs
- Report-to-verification time
- Assignment time
- Resolution time
- SLA compliance
- Reopened-after-resolution rate
- Duplicate consolidation precision/recall
- AI classification precision/recall
- False-positive/false-negative verification rates
- Field evidence completeness
- Citizen verification rate
- Disaster resource match success

## Non-goals
- Legal adjudication of fraud.
- Automatic medical diagnosis.
- Autonomous emergency dispatch.
- Government employee identity issuance.
- Nationwide production integration without authorization.

## UX vision

CivIQ is a modern, trustworthy, mobile-first civic technology platform. The experience must feel premium, fast, clear, professional and human. All user-facing features must be designed mobile-first, targeting Android phones and iPhones as the primary devices, then scaling up to tablet, laptop and desktop. See `docs/ux/README.md` for the complete UX documentation.

## Responsive requirement

Every screen must work correctly across the target viewports (320px–1440px) defined in `docs/ux/RESPONSIVE-SYSTEM.md`. No horizontal overflow, no unreachable content, no unusable touch targets.

## Design-system requirement

All frontend implementation must use the semantic design tokens defined in `docs/ux/DESIGN-SYSTEM.md`. Arbitrary color values, spacing values and typography are not permitted. This ensures visual consistency across all 72 phases.

## Accessibility target

Target WCAG 2.2 AA compliance. All interactive elements must be keyboard accessible, have visible focus states, and meet minimum contrast ratios. Status must never be conveyed by color alone. See `docs/ux/ACCESSIBILITY.md`.

## Motion philosophy

Animation must be purposeful: aiding understanding, providing feedback and creating continuity. Use the duration and easing tokens from `docs/ux/MOTION-SYSTEM.md`. Support `prefers-reduced-motion`. Emergency actions must never be delayed by animation.

## Role-specific UX

Each persona has a tailored mobile-first navigation and workflow. Citizen, field worker, verification officer, department officer, disaster coordinator and platform administrator each have defined navigation patterns and primary actions. See `docs/ux/ROLE-BASED-UX.md`.

## Emergency-first UX

Emergency workflows must remain immediately accessible. Emergency reports use a simplified form, display the official emergency handoff prominently, and record as `UNVERIFIED`. CivIQ must never suggest it replaces official emergency dispatch. See `docs/ux/EMERGENCY-UX.md`.

## AI transparency UX

AI outputs must be clearly labeled as recommendations. Confidence, explanation and timestamps must be shown where meaningful. AI recommendation must be visually distinct from official decision. High-impact AI output requires human confirmation. AI must never be presented as unquestionable truth. See `docs/ux/UI-STATE-SPECIFICATION.md`.
