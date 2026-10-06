# Architecture Baseline

## Deployment shape
Start as a modular monorepo, not premature microservices. Split responsibilities by application/service boundaries and preserve replaceable adapters.

## Recommended stack
- Web/PWA: Next.js + React + TypeScript + Tailwind
- API: Node.js + Express + TypeScript
- Background jobs: Node.js worker + queue abstraction
- Database: PostgreSQL + Prisma
- AI: Python + FastAPI, behind an internal gateway contract
- Realtime: WebSockets / Socket.IO
- Maps: Mapbox or Google Maps behind provider adapter
- Storage: S3-compatible / Supabase / Cloudinary adapter
- Tests: unit + integration + E2E + load
- DevOps: Docker, CI, structured logging, metrics, tracing

## Repository

```text
civiq/
├── apps/
│   ├── web/
│   ├── api/
│   └── worker/
├── services/
│   └── ai/
├── packages/
│   ├── db/
│   ├── contracts/
│   ├── auth/
│   ├── ui/
│   ├── config/
│   └── observability/
├── infra/
├── docker/
├── ci/
├── scripts/
├── tests/
└── docs/
```

## Domain boundaries
Use modules rather than service sprawl: identity, organizations, jurisdictions, evidence, verification, issues, workflow, assignments, SLA, notifications, maps, assets, incidents, disasters, analytics, integrations and audit.

## API principles
- REST first, event contracts for asynchronous work.
- Stable resource IDs.
- Idempotency for ingestion and critical write endpoints.
- Problem-details style errors.
- Cursor pagination.
- Versioned public contracts when breaking changes are unavoidable.
- All privileged mutations produce audit events.

## Data principles
- UUID/ULID strategy documented once and reused.
- createdAt/updatedAt on mutable entities.
- Soft delete only where justified.
- Optimistic versioning where concurrent mutation matters.
- Immutable status history for issues/incidents.
- Separate evidence metadata from raw media.

## AI boundary
The API owns authorization and workflow. The AI service provides typed recommendations with confidence, evidence/explanations, model/provider identifiers and trace IDs. The API decides whether a recommendation is actionable.
