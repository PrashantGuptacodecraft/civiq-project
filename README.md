# CivIQ — National Civic, Incident & Disaster Intelligence Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#security--data-protection-standards)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-blue)](package.json)
[![npm Workspaces](https://img.shields.io/badge/workspaces-npm-red)](package.json)
[![Frontend](https://img.shields.io/badge/frontend-Next.js%2016%20%7C%20React%2019-black)](frontend/)
[![Backend](https://img.shields.io/badge/backend-Express.js%20%7C%20Node.js-green)](backend/)
[![AI Microservice](https://img.shields.io/badge/ai-FastAPI%20%7C%20Python%203.10%2B-teal)](services/ai/)
[![Database](https://img.shields.io/badge/database-Prisma%20ORM%20%7C%20PostgreSQL-indigo)](shared/db/)
[![Accessibility](https://img.shields.io/badge/accessibility-WCAG%202.2%20AA-purple)](docs/ux/ACCESSIBILITY.md)

**CivIQ** is a national-scale, production-ready civic intelligence, incident management, and disaster response platform designed specifically for Indian urban local bodies (ULBs), smart cities, and municipal departments.

Unlike legacy grievance portals that act as passive "complaint black holes," CivIQ provides an end-to-end, closed-loop operational pipeline: from authenticated citizen reporting and AI-assisted triage to workload-aware field dispatch, GPS-geofenced resolution proof, and mandatory citizen sign-off.

---

## The Core Promise

$$\textbf{Identity} \longrightarrow \textbf{Evidence} \longrightarrow \textbf{Verification} \longrightarrow \textbf{Action} \longrightarrow \textbf{Proof} \longrightarrow \textbf{Learning}$$

1. **Identity**: Authenticated reporting via phone OTP or GovID/OAuth; no anonymous spam, while strictly protecting citizen PII.
2. **Evidence**: Media capture with tamper-detection, EXIF verification, and automated antivirus/malware scanning.
3. **Verification**: AI-assisted taxonomy classification, vision evidence validation, and duplicate detection with human-in-the-loop oversight.
4. **Action**: Dynamic SLA-governed routing to municipal departments (PWD, Sanitation, Water, Electrical) and automated field worker dispatch.
5. **Proof**: Field workers must verify presence on-site via GPS geofencing and capture verifiable before-and-after photographic evidence.
6. **Learning**: Citizen resolution review, reopen capability for incomplete work, department accountability metrics, and predictive hotspot analytics.

---

## Key Capabilities

### 1. Citizen Experience & Mobile PWA (`/report`, `/`, `/resolution-review`)
- **Mobile-First Reporting**: Designed specifically for 320px–430px smartphone viewports with seamless touch interactions and offline support.
- **Precise Geolocation**: Native GPS location capture, automatic reverse geocoding, and administrative ward/zone mapping.
- **Evidence Upload**: Photo/video capture with client-side image compression and secure presigned storage.
- **Transparent Status Tracking**: Real-time progress timeline showing triage, assignment, in-progress work, and completion.
- **Citizen Resolution Review**: Direct citizen verification of completed work—citizens can confirm resolution or reopen issues with feedback and photo proof.

### 2. AI Decision Support Gateway (FastAPI Microservice)
- **Automated Issue Classification** (`/v1/classify`): Multi-label NLP & zero-shot classification across civic categories and subcategories.
- **Computer Vision Evidence Analysis** (`/v1/evidence-check`): Automated detection of potholes, garbage dumps, waterlogging, streetlight defects, road hazards, blur, and image tampering.
- **Embedding-Based Deduplication** (`/v1/duplicate-score`): Spatio-temporal clustering and vector semantic embeddings prevent duplicate ticket creation while linking related reports.
- **Explainable Priority Engine** (`/v1/priority-score`): Multi-factor urgency scoring based on safety hazards, population density, vulnerable zones (schools, hospitals), and transparent reasoning breakdowns.
- **AI Governance & Redaction**: Automatic PII sanitization (Aadhaar, phone, faces, license plates) and immutable audit logging for all inferences.

### 3. Municipal Operations & Field Management (`/field`)
- **Department Routing**: Intelligent routing to Urban Local Body departments (Roads, Public Works, Water Supply, Drainage, Solid Waste).
- **Workload-Aware Worker Dispatch**: Zone/ward-level assignment balancing field worker capacity, proximity, and issue severity.
- **SLA Engine & Tiered Escalation**: Category-based SLA timers with working-hours computation and automated multi-tier escalation to supervisors and executive engineers.
- **Field Worker Workflow**: Task acceptance, GPS turn-by-turn navigation, mandatory on-site geofencing (proximity validation), and before/after photo documentation.

### 4. Command Center & Operational GIS (`/map`, `/dashboard`)
- **Interactive Operational GIS Map**: MapLibre/Leaflet geospatial map featuring cluster views, density heatmaps, severity badges, and ward boundary overlays.
- **Command Dashboard**: Real-time executive KPIs, SLA compliance health, department resolution rates, and live operational activity feeds.
- **Emergency Triage**: High-priority safety hazard detection with instant emergency handoffs.

---

## National Coexistence & Integration Architecture

CivIQ is designed to **coexist with and complement** existing Indian public and emergency ecosystems:

| System | Role in CivIQ Architecture |
|---|---|
| **CPGRAMS** | Bi-directional grievance sync for central/state municipal matters. |
| **Emergency 112** | Fast-path emergency escalation for high-hazard accidents and life-safety incidents. |
| **NDMA SACHET** | Ingestion of official disaster alerts and early warnings. |
| **MoRTH iRAD / eDAR** | Road safety and accident intelligence correlation. |
| **Smart City ICCCs** | Standardized telemetry, incident streaming, and sensor integration via IUDX protocols. |

---

## Security & Data Protection Standards

- **Authenticated Reporting**: Citizens authenticate via OTP or verified credentials; anonymous public submissions are disallowed to prevent spam.
- **Strict Citizen Privacy**: CivIQ never stores raw Aadhaar numbers or unredacted identity credentials. Citizen PII is masked by default.
- **AI Boundaries**: AI acts strictly as an advisory decision-support layer. High-impact administrative actions (penalties, contractor blacklisting, emergency escalation) require human authorization.
- **Tamper-Evident Audits**: All status changes, priority recalculations, and administrative overrides generate immutable audit records.
- **Geofenced Field Proof**: Resolutions cannot be marked complete without verified on-site GPS proximity matching and before/after visual proof.

---

## License

This project is licensed under the Apache 2.0 License. See [LICENSE](LICENSE) for details.
