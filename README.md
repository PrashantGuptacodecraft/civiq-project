# CivIQ — National Civic, Incident & Disaster Intelligence Platform

CivIQ is a production-oriented, India-ready architecture for civic issue reporting, incident management, disaster operations, infrastructure intelligence, verification, and AI-assisted decision support.

**This repository is intentionally phase-gated.** An AI coding agent must implement exactly one phase per request, run that phase's checks, create the required commit, and stop.

## How to use with Antigravity / coding agents

1. Open this repository in the IDE.
2. Tell the agent only: **`Execute Phase 01`** (or another phase number).
3. The agent must read `AGENTS.md`, `docs/phase-execution.md`, the requested `docs/phases/phase-XX-*.md`, and any dependency docs.
4. The agent implements only that phase.
5. It runs the phase exit checks.
6. It creates the exact required commit.
7. It stops and reports: commit hash, tests/checks, files changed, and unresolved limitations.
8. You then give the next phase number.

## Current phase

`docs/PHASE_STATUS.md` is the source of truth. Initial state: **Phase 00 complete / Phase 01 next**.

## Architecture at a glance

```text
Citizen / Official / Field Worker / Disaster Coordinator
                         │
                         ▼
                 Web/PWA Experience
                         │
                         ▼
                  Node.js API Layer
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   Trust/Evidence      Workflow        Integrations
        │                │                │
        └────────────────┼────────────────┘
                         ▼
                    AI Gateway
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
 Classification      Deduplication    Priority/Prediction
        │                │                │
        └────────────────┼────────────────┘
                         ▼
                 Field Operations
                         │
                         ▼
               Resolution Verification
                         │
                         ▼
             Analytics / Preventive Ops
                         │
                         ▼
                Situation / Command Room
```

## Design boundary

CivIQ is designed to **coexist with** Indian public systems such as CPGRAMS, 112, SACHET, iRAD/eDAR, ICCC ecosystems, IUDX and government identity/data services. It is not positioned as a replacement for those systems.

## Repository map

- `apps/web` — Next.js/React web/PWA
- `apps/api` — Node.js/Express API
- `apps/worker` — background jobs and queues
- `services/ai` — Python/FastAPI AI service
- `packages/db` — Prisma schema, migrations and seeds
- `packages/contracts` — API/event contracts
- `packages/auth` — shared auth/permission helpers
- `packages/ui` — shared UI components
- `packages/config` — typed environment/config
- `packages/observability` — logs, metrics, tracing helpers
- `docs` — product, architecture, security, AI, API, operations, research and phase specs
- `tests` — end-to-end, integration and load suites

## Non-negotiable product principles

- Authenticated reporters; no anonymous public submissions.
- Identity verification is separate from report/evidence verification.
- AI recommends; authorized humans approve high-impact actions.
- Emergency reports must not be blocked waiting for full AI verification.
- Evidence is auditable; EXIF is not treated as proof.
- Sensitive incident information is private by default.
- Every privileged action is auditable.
- Existing official alerts and emergency services remain authoritative.
- Each phase ends in a clean commit before the next phase begins.

## 72-phase roadmap

See `docs/phases/` and `docs/PHASE_INDEX.md`.
