# CivIQ Master Implementation Blueprint

This file summarizes the complete 72-phase implementation plan. Detailed instructions live in `docs/phases/`.

## Phase 01 — Freeze product vision and acceptance criteria
**Goal:** Create docs/product/PRD.md with personas, problem, goals, boundaries, KPIs and non-goals.

**Tasks:**
- Create docs/product/PRD.md with personas, problem, goals, boundaries, KPIs and non-goals.
- Define the core CivIQ promise: identity → evidence → verification → action → proof → learning.
- Define the first pilot jurisdiction and the India-wide capability target.

**Primary files:**
- `docs/product/PRD.md`
- `docs/product/acceptance-criteria.md`

**Exit checks:** Docs only; lint markdown if configured.
**Commit:** `docs(phase-01): freeze product baseline`

## Phase 02 — Create ADR baseline and engineering principles
**Goal:** Record monorepo choice, API-first design, modular backend, AI gateway, RBAC, auditability and human-in-the-loop rules.

**Tasks:**
- Record monorepo choice, API-first design, modular backend, AI gateway, RBAC, auditability and human-in-the-loop rules.
- Record “no replacement of 112/SACHET/CPGRAMS/iRAD” boundary.
- Define change-control rule for future architecture changes.

**Primary files:**
- `docs/adr/0001-architecture-baseline.md`
- `docs/adr/0002-safety-boundaries.md`

**Exit checks:** Validate ADR format; no app tests yet.
**Commit:** `docs(phase-02): record architecture decisions`

## Phase 03 — Bootstrap monorepo
**Goal:** Initialize workspace with apps/web, apps/api, apps/worker, services/ai and packages.

**Tasks:**
- Initialize workspace with apps/web, apps/api, apps/worker, services/ai and packages.
- Add package manager, shared scripts and basic README.
- Pin current compatible runtime versions and record them.

**Primary files:**
- `package.json`
- `pnpm-workspace.yaml`
- `apps/*`
- `packages/*`
- `services/ai/*`

**Exit checks:** Install; workspace build/typecheck; verify directory contracts.
**Commit:** `chore(phase-03): bootstrap monorepo`

## Phase 04 — Establish coding standards and quality gates
**Goal:** Add ESLint, Prettier, TypeScript strict mode and Python formatting/linting.

**Tasks:**
- Add ESLint, Prettier, TypeScript strict mode and Python formatting/linting.
- Create shared scripts for lint, typecheck, test and build.
- Add basic pre-commit guidance without blocking local work unexpectedly.

**Primary files:**
- `eslint.config.*`
- `prettier.config.*`
- `tsconfig.*`
- `pyproject.toml`

**Exit checks:** Run lint/typecheck across active packages.
**Commit:** `chore(phase-04): establish quality gates`

## Phase 05 — Add CI foundation
**Goal:** Create GitHub Actions for install, lint, typecheck, test and build.

**Tasks:**
- Create GitHub Actions for install, lint, typecheck, test and build.
- Cache dependencies safely and pin action major versions.
- Fail on security-sensitive quality regressions where practical.

**Primary files:**
- `.github/workflows/ci.yml`

**Exit checks:** Run CI-equivalent commands locally.
**Commit:** `ci(phase-05): add continuous integration`

## Phase 06 — Add observability foundation
**Goal:** Create request correlation IDs, structured JSON logging and error boundaries.

**Tasks:**
- Create request correlation IDs, structured JSON logging and error boundaries.
- Define event naming and sensitive-data redaction rules.
- Add health/readiness endpoint contracts for API and AI service.

**Primary files:**
- `packages/observability/*`
- `apps/api/src/observability/*`
- `services/ai/app/observability/*`

**Exit checks:** Unit-test redaction and health endpoints.
**Commit:** `feat(phase-06): add observability foundation`

## Phase 07 — Create database foundation
**Goal:** Initialize PostgreSQL/Prisma and migration workflow.

**Tasks:**
- Initialize PostgreSQL/Prisma and migration workflow.
- Create base schema conventions: UUID/ULID strategy, createdAt/updatedAt, soft-delete policy, optimistic version field where needed.
- Add local development seed framework.

**Primary files:**
- `packages/db/*`

**Exit checks:** Migration apply/reset/seed; schema validation.
**Commit:** `feat(phase-07): initialize database foundation`

## Phase 08 — Build India jurisdiction model
**Goal:** Model country, state/UT, district, local body, block, ward/village and jurisdiction types.

**Tasks:**
- Model country, state/UT, district, local body, block, ward/village and jurisdiction types.
- Support LGD code fields and external references without hard dependency.
- Create sample India hierarchy data for the pilot.

**Primary files:**
- `packages/db/schema/*`
- `scripts/seeds/jurisdiction.*`

**Exit checks:** Seed hierarchy; test parent/child integrity.
**Commit:** `feat(phase-08): add jurisdiction model`

## Phase 09 — Add organization and department model
**Goal:** Create organizations with type, verification status and jurisdiction scope.

**Tasks:**
- Create organizations with type, verification status and jurisdiction scope.
- Create departments and allowed issue categories.
- Implement organization/dept relationships.

**Primary files:**
- `apps/api/src/modules/organizations/*`
- `apps/api/src/modules/departments/*`

**Exit checks:** Service tests for jurisdiction scoping and CRUD.
**Commit:** `feat(phase-09): add organizations and departments`

## Phase 10 — Add permission/RBAC model
**Goal:** Create roles, permissions, role assignments and scoped permissions.

**Tasks:**
- Create roles, permissions, role assignments and scoped permissions.
- Define deny-by-default authorization helper.
- Add permission matrix tests for every planned role.

**Primary files:**
- `packages/auth/*`
- `apps/api/src/modules/access/*`

**Exit checks:** Authorization unit/integration tests.
**Commit:** `feat(phase-10): implement RBAC model`

## Phase 11 — Add audit-log model and writer
**Goal:** Create append-only audit log entity.

**Tasks:**
- Create append-only audit log entity.
- Record actor, action, object, jurisdiction, request ID and timestamp; never store secrets.
- Add helper for system vs human actors.

**Primary files:**
- `apps/api/src/modules/audit/*`
- `packages/db/*`

**Exit checks:** Audit write/read tests; access control tests.
**Commit:** `feat(phase-11): add audit trail`

## Phase 12 — Create external-reference and integration-source model
**Goal:** Model provider/source, external IDs, sync cursor, last-success, error state and data provenance.

**Tasks:**
- Model provider/source, external IDs, sync cursor, last-success, error state and data provenance.
- Support source confidence and source type.
- Prepare adapter contract interfaces.

**Primary files:**
- `apps/api/src/modules/integrations/*`
- `packages/contracts/*`

**Exit checks:** Schema/service tests.
**Commit:** `feat(phase-12): add provenance and integration contracts`

## Phase 13 — Build citizen account model
**Goal:** Create user profile, contact methods, verification states and privacy preferences.

**Tasks:**
- Create user profile, contact methods, verification states and privacy preferences.
- Separate public profile fields from private contact data.
- Add account status and consent timestamps.

**Primary files:**
- `apps/api/src/modules/users/*`

**Exit checks:** Unit/integration tests; migration.
**Commit:** `feat(phase-13): add user accounts`

## Phase 14 — Implement mobile OTP authentication
**Goal:** Implement OTP challenge, expiry, attempt limit, resend cooldown and rate limiting.

**Tasks:**
- Implement OTP challenge, expiry, attempt limit, resend cooldown and rate limiting.
- Store only safe verification artifacts; do not log OTP values.
- Create session issuance after successful verification.

**Primary files:**
- `apps/api/src/modules/auth/otp/*`

**Exit checks:** Auth integration tests including brute-force and replay cases.
**Commit:** `feat(phase-14): implement mobile OTP auth`

## Phase 15 — Implement Google sign-in
**Goal:** Add Google OAuth/OIDC login through a backend-controlled callback.

**Tasks:**
- Add Google OAuth/OIDC login through a backend-controlled callback.
- Link verified provider identity to an existing user safely.
- Require mobile verification before report submission.

**Primary files:**
- `apps/api/src/modules/auth/google/*`
- `apps/web/app/auth/*`

**Exit checks:** OAuth callback tests and account-linking tests.
**Commit:** `feat(phase-15): add Google authentication`

## Phase 16 — Implement email/password authentication
**Goal:** Secure password hashing; verification flow; reset flow.

**Tasks:**
- Secure password hashing; verification flow; reset flow.
- Add rate limiting and suspicious-attempt monitoring.
- Prevent account enumeration in public responses.

**Primary files:**
- `apps/api/src/modules/auth/password/*`

**Exit checks:** Auth/security tests.
**Commit:** `feat(phase-16): add email authentication`

## Phase 17 — Implement session/device security
**Goal:** Add refresh/session rotation, revocation, device/session listing and logout-all.

**Tasks:**
- Add refresh/session rotation, revocation, device/session listing and logout-all.
- Add re-authentication requirement for sensitive actions.
- Log auth and authorization events.

**Primary files:**
- `apps/api/src/modules/auth/session/*`

**Exit checks:** Session security tests.
**Commit:** `feat(phase-17): harden sessions and devices`

## Phase 18 — Build government organization onboarding
**Goal:** Create invite flow from an organization admin to employee.

**Tasks:**
- Create invite flow from an organization admin to employee.
- Require official email/employee identifier and department scope.
- Store who approved the official role and when.

**Primary files:**
- `apps/api/src/modules/officials/onboarding/*`
- `apps/web/features/official-onboarding/*`

**Exit checks:** Invitation, expiry, replay and approval tests.
**Commit:** `feat(phase-18): add official onboarding`

## Phase 19 — Create user trust profile
**Goal:** Define trust levels and transparent factors: verification status, valid report history, confirmed abuse history.

**Tasks:**
- Define trust levels and transparent factors: verification status, valid report history, confirmed abuse history.
- Keep trust separate from report truth.
- Create safe score recalculation job design.

**Primary files:**
- `apps/api/src/modules/trust/*`

**Exit checks:** Deterministic scoring tests.
**Commit:** `feat(phase-19): add user trust profiles`

## Phase 20 — Build report verification state machine
**Goal:** Implement submitted → verification → verified/rejected/needs evidence/duplicate transitions.

**Tasks:**
- Implement submitted → verification → verified/rejected/needs evidence/duplicate transitions.
- Enforce allowed transitions and role permissions.
- Write status history on every transition.

**Primary files:**
- `apps/api/src/modules/verification/*`
- `packages/contracts/verification.*`

**Exit checks:** State-machine tests for every transition.
**Commit:** `feat(phase-20): implement verification workflow`

## Phase 21 — Implement evidence intake and metadata checks
**Goal:** Build secure media metadata extraction pipeline.

**Tasks:**
- Build secure media metadata extraction pipeline.
- Record capture time/location when provided without trusting metadata as proof.
- Add image hash/perceptual hash placeholder contract.

**Primary files:**
- `apps/api/src/modules/evidence/*`
- `apps/worker/src/jobs/evidence/*`

**Exit checks:** Media-security tests, metadata parsing tests.
**Commit:** `feat(phase-21): add evidence processing pipeline`

## Phase 22 — Implement duplicate detection engine v1
**Goal:** Combine geo distance, time window and normalized text similarity.

**Tasks:**
- Combine geo distance, time window and normalized text similarity.
- Return candidate duplicates, similarity explanation and threshold.
- Require human confirmation before merging high-impact cases.

**Primary files:**
- `apps/api/src/modules/duplicates/*`

**Exit checks:** Unit tests with false-positive and false-negative fixtures.
**Commit:** `feat(phase-22): add duplicate detection v1`

## Phase 23 — Add abuse/fraud controls
**Goal:** Detect burst reporting, repeated media, suspicious device/account patterns and API abuse.

**Tasks:**
- Detect burst reporting, repeated media, suspicious device/account patterns and API abuse.
- Implement temporary throttles and verification escalation.
- Do not automatically label a person criminal/fraudulent; store risk signal and reviewer decision.

**Primary files:**
- `apps/api/src/modules/abuse/*`
- `apps/api/src/modules/risk/*`

**Exit checks:** Abuse scenario tests.
**Commit:** `feat(phase-23): add anti-abuse controls`

## Phase 24 — Build verification officer console
**Goal:** Create queue for pending, suspicious, duplicate and evidence-needed reports.

**Tasks:**
- Create queue for pending, suspicious, duplicate and evidence-needed reports.
- Show evidence, user trust, location checks, AI recommendations and provenance.
- Add verify/request evidence/reject actions with mandatory reason codes.

**Primary files:**
- `apps/web/features/verification/*`

**Exit checks:** E2E tests for verification workflow.
**Commit:** `feat(phase-24): build verification console`

## Phase 25 — Define civic issue taxonomy
**Goal:** Create categories for roads, drainage, sanitation, electrical, water, waste, public facilities and other civic services.

**Tasks:**
- Create categories for roads, drainage, sanitation, electrical, water, waste, public facilities and other civic services.
- Attach default department/SLA metadata.
- Keep taxonomy versioned.

**Primary files:**
- `packages/contracts/issue-taxonomy/*`
- `packages/db/seeds/taxonomy.*`

**Exit checks:** Taxonomy validation tests.
**Commit:** `feat(phase-25): add civic issue taxonomy`

## Phase 26 — Implement issue creation API
**Goal:** Create issue with description, category, jurisdiction, location and source.

**Tasks:**
- Create issue with description, category, jurisdiction, location and source.
- Require authenticated user for public submission.
- Return immutable issue ID and submission status.

**Primary files:**
- `apps/api/src/modules/issues/*`

**Exit checks:** API integration tests and validation tests.
**Commit:** `feat(phase-26): add civic issue API`

## Phase 27 — Build citizen report UI
**Goal:** Mobile-first report form, category selection, location picker, draft/save and upload.

**Tasks:**
- Mobile-first report form, category selection, location picker, draft/save and upload.
- Show explicit verification expectations and emergency warning.
- Handle network errors and retries.

**Primary files:**
- `apps/web/features/reporting/*`

**Exit checks:** Component tests + E2E submission test.
**Commit:** `feat(phase-27): build citizen reporting`

## Phase 28 — Add secure media storage
**Goal:** Use object storage with private-by-default media.

**Tasks:**
- Use object storage with private-by-default media.
- Generate signed upload/download URLs.
- Validate type/size and quarantine unsafe content.

**Primary files:**
- `apps/api/src/modules/media/*`
- `apps/worker/src/jobs/media/*`

**Exit checks:** Upload security tests.
**Commit:** `feat(phase-28): add secure media storage`

## Phase 29 — Add geolocation and jurisdiction resolution
**Goal:** Capture user-selected/available GPS and map point.

**Tasks:**
- Capture user-selected/available GPS and map point.
- Resolve point to jurisdiction and store resolver version/source.
- Handle ambiguous boundaries and manual correction.

**Primary files:**
- `apps/api/src/modules/geography/*`
- `apps/web/features/map/*`

**Exit checks:** Geospatial resolution tests with boundary fixtures.
**Commit:** `feat(phase-29): add geolocation resolution`

## Phase 30 — Add issue lifecycle and notifications
**Goal:** Connect status changes to notification events.

**Tasks:**
- Connect status changes to notification events.
- Implement in-app notification and email adapter.
- Keep notification delivery idempotent.

**Primary files:**
- `apps/api/src/modules/notifications/*`
- `apps/worker/src/jobs/notifications/*`

**Exit checks:** Event/idempotency tests.
**Commit:** `feat(phase-30): add issue lifecycle notifications`

## Phase 31 — Create AI gateway contract
**Goal:** Define versioned AI operations: classify, evidence-check, duplicate-score, priority-score, route, summarize, predict.

**Tasks:**
- Define versioned AI operations: classify, evidence-check, duplicate-score, priority-score, route, summarize, predict.
- Create provider-agnostic request/response schemas.
- Return confidence, model/version, explanations and latency.

**Primary files:**
- `services/ai/app/api/*`
- `packages/contracts/ai/*`

**Exit checks:** Contract tests and schema validation.
**Commit:** `feat(phase-31): add AI gateway contract`

## Phase 32 — Build AI classification service
**Goal:** Implement text classification baseline using a pluggable model/provider.

**Tasks:**
- Implement text classification baseline using a pluggable model/provider.
- Return category/subcategory confidence and top alternatives.
- Allow human correction to be stored as labeled feedback.

**Primary files:**
- `services/ai/app/pipelines/classification/*`

**Exit checks:** Evaluation fixture set; precision/recall smoke test.
**Commit:** `feat(phase-32): add issue classification`

## Phase 33 — Build image relevance/evidence service
**Goal:** Implement image relevance classifier for supported civic categories.

**Tasks:**
- Implement image relevance classifier for supported civic categories.
- Record confidence and uncertainty; low confidence routes to review.
- Document limitations and supported classes.

**Primary files:**
- `services/ai/app/pipelines/vision/*`
- `docs/ai/model-card-vision.md`

**Exit checks:** Evaluation on held-out sample; no unsafe auto-reject.
**Commit:** `feat(phase-33): add vision evidence analysis`

## Phase 34 — Upgrade duplicate detection with embeddings
**Goal:** Add text embeddings and image embeddings where available.

**Tasks:**
- Add text embeddings and image embeddings where available.
- Combine with geo/time signals in a transparent ensemble score.
- Store candidate pairs and decision evidence.

**Primary files:**
- `services/ai/app/pipelines/dedup/*`
- `apps/api/src/modules/duplicates/*`

**Exit checks:** Offline evaluation set and threshold report.
**Commit:** `feat(phase-34): add embedding-based deduplication`

## Phase 35 — Build explainable priority engine
**Goal:** Implement deterministic feature extraction for severity, safety risk, impact, corroboration, age and location context.

**Tasks:**
- Implement deterministic feature extraction for severity, safety risk, impact, corroboration, age and location context.
- Use configurable weights/rules and optionally a model behind the same contract.
- Return reasons alongside score.

**Primary files:**
- `apps/api/src/modules/priority/*`
- `services/ai/app/pipelines/priority/*`

**Exit checks:** Unit tests with explainability assertions.
**Commit:** `feat(phase-35): add explainable priority engine`

## Phase 36 — Build AI recommendation/audit pipeline
**Goal:** Persist AI inference results, model version, prompts/config hash where relevant and human decision.

**Tasks:**
- Persist AI inference results, model version, prompts/config hash where relevant and human decision.
- Create evaluation record format.
- Add admin view for AI recommendations vs final decisions.

**Primary files:**
- `apps/api/src/modules/ai-audit/*`
- `packages/db/*`

**Exit checks:** Auditability tests; redaction tests.
**Commit:** `feat(phase-36): add AI audit trail`

## Phase 37 — Implement smart department routing
**Goal:** Map taxonomy + jurisdiction to allowed departments.

**Tasks:**
- Map taxonomy + jurisdiction to allowed departments.
- Add AI recommendation but enforce policy rules and jurisdiction constraints.
- Route only after verification gate except configured low-risk classes.

**Primary files:**
- `apps/api/src/modules/routing/*`

**Exit checks:** Routing matrix tests.
**Commit:** `feat(phase-37): add department routing`

## Phase 38 — Implement worker eligibility and assignment
**Goal:** Model worker skills, coverage area, availability and workload.

**Tasks:**
- Model worker skills, coverage area, availability and workload.
- Create assignment recommendation: skill + jurisdiction + proximity + workload.
- Allow officer override with reason.

**Primary files:**
- `apps/api/src/modules/assignments/*`

**Exit checks:** Deterministic assignment tests.
**Commit:** `feat(phase-38): add worker assignment`

## Phase 39 — Implement SLA rules
**Goal:** Create configurable SLA by issue category, priority, jurisdiction and working-hours policy.

**Tasks:**
- Create configurable SLA by issue category, priority, jurisdiction and working-hours policy.
- Compute due times and aging.
- Show countdown and overdue state.

**Primary files:**
- `apps/api/src/modules/sla/*`

**Exit checks:** Time-zone and boundary tests.
**Commit:** `feat(phase-39): add SLA engine`

## Phase 40 — Implement escalation workflow
**Goal:** Warn at configurable thresholds; escalate to supervisor/department officer when breached.

**Tasks:**
- Warn at configurable thresholds; escalate to supervisor/department officer when breached.
- Prevent duplicate escalation storms.
- Audit every escalation.

**Primary files:**
- `apps/api/src/modules/escalation/*`

**Exit checks:** Escalation/idempotency tests.
**Commit:** `feat(phase-40): add SLA escalation`

## Phase 41 — Build field worker PWA experience
**Goal:** Create installable/mobile-first task list, task detail, status updates and navigation handoff.

**Tasks:**
- Create installable/mobile-first task list, task detail, status updates and navigation handoff.
- Restrict data to assigned jurisdiction/tasks.
- Add retry-safe mutations.

**Primary files:**
- `apps/web/features/field/*`

**Exit checks:** PWA smoke test + authz E2E.
**Commit:** `feat(phase-41): build field worker workflow`

## Phase 42 — Add before/after proof and field verification
**Goal:** Require configurable evidence for task completion.

**Tasks:**
- Require configurable evidence for task completion.
- Capture GPS/time context and bind evidence to assignment.
- Supervisor verifies completion; reject/reopen if evidence is insufficient.

**Primary files:**
- `apps/api/src/modules/field-verification/*`
- `apps/web/features/field/*`

**Exit checks:** Evidence-chain tests.
**Commit:** `feat(phase-42): add field verification`

## Phase 43 — Add citizen resolution verification
**Goal:** Notify citizen after proposed resolution.

**Tasks:**
- Notify citizen after proposed resolution.
- Allow confirm/reopen with reason and optional evidence.
- Feed confirmed/unconfirmed outcomes into quality metrics.

**Primary files:**
- `apps/web/features/resolution-review/*`
- `apps/api/src/modules/feedback/*`

**Exit checks:** E2E resolution and reopen tests.
**Commit:** `feat(phase-43): add citizen resolution verification`

## Phase 44 — Build operational map
**Goal:** Show issue points by status, priority, department and verification state.

**Tasks:**
- Show issue points by status, priority, department and verification state.
- Implement clustering, filters, pagination and privacy-safe public view.
- Keep exact evidence private to authorized roles.

**Primary files:**
- `apps/web/features/operations-map/*`

**Exit checks:** Map and authorization tests.
**Commit:** `feat(phase-44): build operational map`

## Phase 45 — Build authority command dashboard
**Goal:** KPIs: open, verified, SLA-breached, average resolution, reopened, duplicate rate.

**Tasks:**
- KPIs: open, verified, SLA-breached, average resolution, reopened, duplicate rate.
- Department/ward filters and drill-down.
- Show data freshness and source labels.

**Primary files:**
- `apps/web/features/dashboard/*`

**Exit checks:** Dashboard data correctness tests.
**Commit:** `feat(phase-45): build command dashboard`

## Phase 46 — Implement hotspot analytics
**Goal:** Detect geographic concentration of incidents using configurable spatial windows/clustering.

**Tasks:**
- Detect geographic concentration of incidents using configurable spatial windows/clustering.
- Show trends by time/category.
- Label analytics as analytical, not causal proof.

**Primary files:**
- `apps/api/src/modules/analytics/hotspots/*`
- `apps/web/features/analytics/*`

**Exit checks:** Synthetic hotspot fixtures and correctness tests.
**Commit:** `feat(phase-46): add hotspot analytics`

## Phase 47 — Implement recurring issue analytics
**Goal:** Link issues to assets where available.

**Tasks:**
- Link issues to assets where available.
- Detect repeated failures by asset/category/location/time.
- Generate maintenance-review candidates.

**Primary files:**
- `apps/api/src/modules/analytics/recurrence/*`

**Exit checks:** Recurrence tests.
**Commit:** `feat(phase-47): add recurring issue intelligence`

## Phase 48 — Add operational reports and exports
**Goal:** Export jurisdiction-scoped issue lists, SLA reports, performance and audit summaries.

**Tasks:**
- Export jurisdiction-scoped issue lists, SLA reports, performance and audit summaries.
- Apply redaction rules and export authorization.
- Add asynchronous generation for larger reports.

**Primary files:**
- `apps/api/src/modules/reports/*`
- `apps/worker/src/jobs/reports/*`

**Exit checks:** Authorization and export tests.
**Commit:** `feat(phase-48): add operational reporting`

## Phase 49 — Build asset registry
**Goal:** Model road segments, streetlights, drains, water assets, public facilities and other maintainable assets.

**Tasks:**
- Model road segments, streetlights, drains, water assets, public facilities and other maintainable assets.
- Support asset owner department and jurisdiction.
- Add lifecycle status.

**Primary files:**
- `apps/api/src/modules/assets/*`

**Exit checks:** CRUD/authz tests.
**Commit:** `feat(phase-49): add asset registry`

## Phase 50 — Link issues to assets
**Goal:** Allow confirmed issues to be linked to one or more assets.

**Tasks:**
- Allow confirmed issues to be linked to one or more assets.
- Maintain link history and confidence.
- Use nearest-asset candidate suggestions.

**Primary files:**
- `apps/api/src/modules/assets-links/*`

**Exit checks:** Geospatial candidate tests.
**Commit:** `feat(phase-50): link issues to assets`

## Phase 51 — Add maintenance history and cost tracking
**Goal:** Record maintenance actions, parts/labor cost, downtime and outcomes.

**Tasks:**
- Record maintenance actions, parts/labor cost, downtime and outcomes.
- Ensure financial fields are controlled and auditable.
- Build asset timeline.

**Primary files:**
- `apps/api/src/modules/maintenance/*`

**Exit checks:** Timeline and access tests.
**Commit:** `feat(phase-51): add maintenance history`

## Phase 52 — Build predictive maintenance baseline
**Goal:** Create baseline model using failure frequency, age, maintenance history and recurrence.

**Tasks:**
- Create baseline model using failure frequency, age, maintenance history and recurrence.
- Return risk score + reason codes.
- Keep action as “maintenance review recommended”, not automatic replacement.

**Primary files:**
- `services/ai/app/pipelines/maintenance/*`

**Exit checks:** Offline evaluation with synthetic/seeded data.
**Commit:** `feat(phase-52): add predictive maintenance baseline`

## Phase 53 — Add asset intelligence dashboard
**Goal:** Show high-recurrence/high-downtime assets, failure trend and maintenance candidates.

**Tasks:**
- Show high-recurrence/high-downtime assets, failure trend and maintenance candidates.
- Link dashboard to source issues and proof.
- Add drill-down to asset timeline.

**Primary files:**
- `apps/web/features/assets/*`

**Exit checks:** Dashboard correctness tests.
**Commit:** `feat(phase-53): add asset intelligence dashboard`

## Phase 54 — Add cost/benefit decision support
**Goal:** Estimate cumulative repair cost vs replacement-review threshold.

**Tasks:**
- Estimate cumulative repair cost vs replacement-review threshold.
- Allow policy-configured thresholds per asset category.
- Provide explainable recommendations.

**Primary files:**
- `apps/api/src/modules/asset-decisions/*`
- `services/ai/app/pipelines/asset-decision/*`

**Exit checks:** Decision-rule tests.
**Commit:** `feat(phase-54): add asset decision support`

## Phase 55 — Build accident/incident reporting model
**Goal:** Create incident entity separate from ordinary civic issues.

**Tasks:**
- Create incident entity separate from ordinary civic issues.
- Capture location, time, evidence, incident type, possible hazards and status.
- Keep sensitive details protected.

**Primary files:**
- `apps/api/src/modules/incidents/*`

**Exit checks:** Incident model/API tests.
**Commit:** `feat(phase-55): add incident model`

## Phase 56 — Build accident response workflow
**Goal:** Add rapid incident submission, unverified state, responder confirmation and closure.

**Tasks:**
- Add rapid incident submission, unverified state, responder confirmation and closure.
- Show Call 112 handoff prominently for actual emergencies.
- Create incident timeline and notifications.

**Primary files:**
- `apps/web/features/incidents/*`
- `apps/api/src/modules/incidents/*`

**Exit checks:** Emergency UX and safety-path tests.
**Commit:** `feat(phase-56): add accident response workflow`

## Phase 57 — Add road-safety correlation analytics
**Goal:** Correlate incident clusters with civic issue/asset history and official accident data when legally/technically available.

**Tasks:**
- Correlate incident clusters with civic issue/asset history and official accident data when legally/technically available.
- Avoid claiming causality.
- Produce “investigation recommended” hotspots.

**Primary files:**
- `apps/api/src/modules/analytics/safety/*`

**Exit checks:** Correlation correctness tests.
**Commit:** `feat(phase-57): add road safety analytics`

## Phase 58 — Add official-source incident adapter contract
**Goal:** Create adapter interface for iRAD/eDAR-like or future official accident feeds.

**Tasks:**
- Create adapter interface for iRAD/eDAR-like or future official accident feeds.
- Normalize external IDs and provenance.
- Default to mock/sandbox adapter for college deployment.

**Primary files:**
- `apps/api/src/integrations/incident-source/*`

**Exit checks:** Adapter contract tests.
**Commit:** `feat(phase-58): add accident data adapter contract`

## Phase 59 — Add emergency responder/agency role model
**Goal:** Model authorized responder organizations and scoped access.

**Tasks:**
- Model authorized responder organizations and scoped access.
- Add dispatch recommendation without pretending CivIQ is the official emergency dispatch center.
- Audit sensitive incident access.

**Primary files:**
- `apps/api/src/modules/responders/*`

**Exit checks:** RBAC/incident data access tests.
**Commit:** `feat(phase-59): add responder roles`

## Phase 60 — Add public safety communication templates
**Goal:** Create approved templates for verified issue alerts, incident updates and official-source notices.

**Tasks:**
- Create approved templates for verified issue alerts, incident updates and official-source notices.
- Include emergency disclaimer/handoff.
- Prevent unreviewed AI text from becoming an official warning.

**Primary files:**
- `apps/api/src/modules/communications/*`
- `docs/operations/communications-policy.md`

**Exit checks:** Template safety tests.
**Commit:** `feat(phase-60): add safety communications`

## Phase 61 — Build disaster event model
**Goal:** Model disaster types, official alert references, affected polygons, severity, state and lifecycle.

**Tasks:**
- Model disaster types, official alert references, affected polygons, severity, state and lifecycle.
- Store source provenance and official-vs-user signal distinction.
- Support concurrent disasters.

**Primary files:**
- `apps/api/src/modules/disasters/*`

**Exit checks:** Event model tests.
**Commit:** `feat(phase-61): add disaster event model`

## Phase 62 — Build official alert ingestion adapter
**Goal:** Implement CAP/RSS-style alert parser and source adapter contract.

**Tasks:**
- Implement CAP/RSS-style alert parser and source adapter contract.
- Validate source signature/provenance where the source supports it.
- Never rewrite official alert content without clear source labeling.

**Primary files:**
- `apps/api/src/integrations/alerts/*`
- `apps/worker/src/jobs/alerts/*`

**Exit checks:** Parser fixtures, idempotency tests.
**Commit:** `feat(phase-62): add disaster alert ingestion`

## Phase 63 — Build disaster impact reporting
**Goal:** Citizen/field reports for flooding, blocked roads, utility outage, stranded people, damage and needs.

**Tasks:**
- Citizen/field reports for flooding, blocked roads, utility outage, stranded people, damage and needs.
- Bind reports to disaster event and geography.
- Use emergency-fast path with unverified status.

**Primary files:**
- `apps/web/features/disaster-reporting/*`
- `apps/api/src/modules/disaster-impact/*`

**Exit checks:** Impact reporting E2E tests.
**Commit:** `feat(phase-63): add disaster impact reporting`

## Phase 64 — Build resource and shelter registry
**Goal:** Model shelters, medical camps, relief centers, volunteers, vehicles and supplies as verified resource records.

**Tasks:**
- Model shelters, medical camps, relief centers, volunteers, vehicles and supplies as verified resource records.
- Track capacity with source and timestamp.
- Support jurisdiction scoping.

**Primary files:**
- `apps/api/src/modules/resources/*`

**Exit checks:** Capacity and authorization tests.
**Commit:** `feat(phase-64): add disaster resources`

## Phase 65 — Build need-to-resource matching
**Goal:** Match requests to verified resources using distance, capacity, type and status.

**Tasks:**
- Match requests to verified resources using distance, capacity, type and status.
- Provide recommended matches; authorized coordinator accepts assignment.
- Track fulfilment and confirmation.

**Primary files:**
- `apps/api/src/modules/resource-matching/*`
- `services/ai/app/pipelines/resource-matching/*`

**Exit checks:** Deterministic matching tests.
**Commit:** `feat(phase-65): add resource matching`

## Phase 66 — Build disaster situation room and after-action review
**Goal:** Create event command dashboard: alerts, impact clusters, blocked routes, needs, resources, response tasks.

**Tasks:**
- Create event command dashboard: alerts, impact clusters, blocked routes, needs, resources, response tasks.
- Add event timeline and post-event metrics.
- Generate AI-assisted after-action summary with source labels.

**Primary files:**
- `apps/web/features/situation-room/*`
- `apps/api/src/modules/disaster-ops/*`

**Exit checks:** End-to-end disaster simulation test.
**Commit:** `feat(phase-66): build disaster situation room`

## Phase 67 — Add multilingual architecture
**Goal:** Create locale keys, language preferences and translation adapter.

**Tasks:**
- Create locale keys, language preferences and translation adapter.
- Integrate text/voice translation provider behind an adapter; BHASHINI-compatible path is preferred for Indian-language support.
- Start with English + Hindi and make additional languages configuration-driven.

**Primary files:**
- `apps/web/lib/i18n/*`
- `apps/api/src/modules/i18n/*`
- `apps/api/src/integrations/bhashini/*`

**Exit checks:** Translation key completeness tests.
**Commit:** `feat(phase-67): add multilingual foundation`

## Phase 68 — Add voice reporting
**Goal:** Implement speech-to-text adapter for citizen reports.

**Tasks:**
- Implement speech-to-text adapter for citizen reports.
- Normalize transcript, keep original audio privacy-safe and optional.
- Add confirmation step before submission.

**Primary files:**
- `apps/web/features/voice/*`
- `apps/api/src/integrations/speech/*`

**Exit checks:** Voice pipeline integration tests with mocked provider.
**Commit:** `feat(phase-68): add voice reporting`

## Phase 69 — Add offline field sync
**Goal:** Create local task cache, mutation queue and sync conflict strategy.

**Tasks:**
- Create local task cache, mutation queue and sync conflict strategy.
- Use idempotency keys for field updates.
- Show sync state clearly to workers.

**Primary files:**
- `apps/web/features/offline/*`
- `apps/api/src/modules/sync/*`

**Exit checks:** Offline/online E2E simulation.
**Commit:** `feat(phase-69): add offline field sync`

## Phase 70 — Security hardening and threat-model closure
**Goal:** Run threat-model review across auth, uploads, RBAC, AI prompt/data paths, webhooks and integrations.

**Tasks:**
- Run threat-model review across auth, uploads, RBAC, AI prompt/data paths, webhooks and integrations.
- Add security headers, rate limiting, authorization tests, secret scanning and dependency audit.
- Document incident response and account recovery.

**Primary files:**
- `docs/security/threat-model.md`
- `docs/security/controls.md`
- `.github/workflows/security.yml`

**Exit checks:** Security test suite; dependency and secret checks.
**Commit:** `security(phase-70): harden production security`

## Phase 71 — Performance, resilience and observability closure
**Goal:** Add caching where safe, DB indexes, query budgets and async jobs for slow work.

**Tasks:**
- Add caching where safe, DB indexes, query budgets and async jobs for slow work.
- Add metrics for API latency, verification backlog, SLA backlog, queue age and AI latency.
- Test backup/restore and failure behavior for external integrations.

**Primary files:**
- `apps/api/src/observability/*`
- `docs/operations/sre.md`
- `tests/load/*`

**Exit checks:** Load test baseline + backup/restore drill.
**Commit:** `perf(phase-71): harden performance and resilience`

## Phase 72 — Production pilot, documentation and release
**Goal:** Seed a realistic pilot dataset; complete UAT scenarios for every role.

**Tasks:**
- Seed a realistic pilot dataset; complete UAT scenarios for every role.
- Finalize runbooks, API docs, security checklist, model cards, demo script and project report.
- Deploy the pilot, verify monitoring, create release tag and final architecture snapshot.

**Primary files:**
- `docs/operations/*`
- `docs/product/*`
- `docs/api/*`
- `docs/ai/*`
- `CHANGELOG.md`

**Exit checks:** Full regression, UAT sign-off and production smoke test.
**Commit:** `release(phase-72): publish pilot-ready CivIQ`
