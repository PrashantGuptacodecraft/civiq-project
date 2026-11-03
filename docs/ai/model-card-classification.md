# AI Model Governance Card: Multilingual Issue Classification & Duplicate Detection
**Phase 72: Production Pilot Release Documentation**

---

## 1. Model Overview
- **Pipeline Identifier:** `civiq-ai-taxonomy-ensemble-v1.0.0`
- **Supported Languages:** 12 Indian Languages (Hindi, Marathi, English, Tamil, Telugu, Bengali, Gujarati, Kannada, Malayalam, Odia, Punjabi, Urdu)
- **Primary Tasks:**
  1. Civic Grievance Category Classification (mapped to `CIVIC_ISSUE_TAXONOMY_V1`).
  2. Severity Assessment & Priority Scoring.
  3. Near-Duplicate Incident Detection via geospatial-temporal-text ensemble.

---

## 2. Intended Use & Boundaries
- **Intended Use:** Assist municipal verification officers and department dispatchers by recommending categories, detecting duplicates, and identifying emergency triggers.
- **Out-of-Scope / Prohibited Use:** 
  - Automated rejection of citizen grievances without human review.
  - Making final binding emergency or casualty decisions without official liaison.
  - Storing raw Aadhaar numbers or unmasked citizen identity credentials.

---

## 3. Human-in-the-Loop & Statutory Transparency
- **AI Disclaimer:** Every AI-derived insight in the UI carries the mandatory indicator: *"AI-assisted recommendation. Non-final; requires municipal official verification."*
- **Audit Logging:** Every AI decision logs `promptConfigHash`, `traceId`, `latencyMs`, `confidence`, and human decision outcome (`ACCEPTED`, `MODIFIED`, `OVERRIDDEN`) in `ai_audit_records`.
- **Latency SLO:** `p95` inference latency `< 400ms` monitored continuously via `/metrics`.
