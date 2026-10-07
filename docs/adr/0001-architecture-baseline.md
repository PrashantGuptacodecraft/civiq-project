# ADR 0001: Architecture Baseline and Engineering Principles

## Status
Accepted

## Context
CivIQ requires a highly scalable, accountable, and modular foundation to support the goals defined in the Phase 01 product baseline. The architecture must enable clear boundaries, reliable auditability, and safe AI integration for civic issue reporting and incident management.

## Decision
We adopt the following baseline engineering principles and architecture rules:
1. **Monorepo Choice:** Use a pnpm-managed monorepo containing all apps, services, and shared packages to ensure consistent dependency management and cross-boundary type safety.
2. **API-First Design:** All backend capabilities must be exposed via well-defined API contracts before being consumed by frontends.
3. **Modular Backend:** Backend concerns are separated into a Node.js core API layer and a dedicated background worker layer for queues and async tasks.
4. **AI Gateway:** All AI interactions (classification, deduplication, recommendations) are routed through a dedicated AI gateway microservice. 
5. **RBAC (Role-Based Access Control):** Every action in the system must be governed by strict roles and permissions defined at the core package level.
6. **Auditability:** Every privileged action must be securely logged and auditable.
7. **Human-in-the-Loop:** AI acts strictly as an assistant. Any high-impact or life-critical decision (e.g., emergency dispatch, public safety alerts) must require explicit approval from an authorized human operator.

### Change-Control Rule
Any future proposed modifications to this foundational architecture or the introduction of new core paradigms must be documented and reviewed as a new Architecture Decision Record (ADR) before implementation.
