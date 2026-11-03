# Site Reliability Engineering (SRE), Observability & Resilience Architecture
**Phase 71: Performance, Resilience, and Observability Closure**

---

## 1. Reliability & SRE Target Objectives (SLAs / SLOs / SLIs)

CivIQ operates as public digital infrastructure for Indian civic grievance redressal and municipal disaster response. The platform adheres to strict service level objectives (SLOs):

| Boundary | Service Level Indicator (SLI) | Service Level Objective (SLO) | Alert Threshold / Error Budget |
|---|---|---|---|
| **Public Grievance API** | `p95` Latency on read/write endpoints | `< 250ms` | `p95 > 500ms` for 5 consecutive minutes |
| **Disaster Rapid Ingress** | Availability & `p99` latency on rapid incident API | `99.99%` uptime, `< 150ms` `p99` | Error budget consumption > 20% in 1 hour |
| **Verification Backlog** | Pending unverified citizen issues queue depth | `< 500` issues across district | Depth > 1000 for > 2 hours |
| **SLA Resolution Backlog** | Escalation breach count across departments | `< 5%` breach rate | Breach rate > 10% daily |
| **Job Queue Age** | BullMQ/Job queue oldest message latency | `< 30s` for priority jobs | Queue age > 120s triggers scale-out |
| **AI Inference Latency** | `p95` time for classification & duplicate detection | `< 400ms` | `p95 > 800ms` |

---

## 2. Multi-Layer Observability & Telemetry

### 2.1 Latency & Performance Instrumentation
- **API Request Latency:** Automated middleware captures duration for all HTTP ingress traffic, maintaining rolling percentiles (`p50`, `p95`, `p99`).
- **AI Model Execution Latency:** AI audit integration (`AiAuditService`) records model inference duration (`latencyMs`) for prompt classification, vision heuristics, and duplicate detection.
- **Database Query Latencies:** Instrumented with `withQueryBudget(operationName, fn, { budgetMs })` to log slow queries and track query latency distribution.
- **Real-Time Endpoint:** `/metrics` exposes system-wide health, cache hit rates, queue ages, and integration circuit breaker statuses.

### 2.2 PII Redaction & Correlation Tracking
- Every log message and trace preserves structured JSON formatting via Pino logger.
- PII (Aadhaar numbers, phone numbers, tokens, passwords) is censored (`[REDACTED]`) before persistence.
- Requests propagate an end-to-end `correlationId` (UUID v4) across web, API, worker jobs, and AI pipelines.

---

## 3. High-Throughput Safe Caching & Query Budgets

### 3.1 Caching Boundaries & Safety Principles
To maintain freshness while preventing database saturation during high-traffic civic events:
1. **Command Dashboard KPIs (`dashboardCache`):** Cached for 30 seconds (`SafeCache`, LRU max 100 entries). Provides immediate responsiveness to municipal command centers without re-aggregating thousands of records on every page refresh.
2. **Operational Map Geo-Aggregations (`operationalMapCache`):** Cached with 20-second TTL keyed by bounding box and status filter.
3. **Translation Cache (`BhashiniAdapter.cache`):** Deterministic translation cache keyed by language pair and normalized source string. Eliminates redundant external API calls for static civic taxonomy and standard prompts.

### 3.2 Database Indexes & Query Budgets
Composite PostgreSQL indexes optimize critical paths:
- `@@index([jurisdictionId, status, createdAt])`: Accelerates departmental SLA tracking and localized triage.
- `@@index([verificationStatus, createdAt])`: Guarantees sub-millisecond retrieval of verification backlog items.
- `@@index([latitude, longitude])`: Fast spatial bounding-box indexing for operational situation rooms.
- `withQueryBudget`: Strict 1000ms–1500ms budget wrappers safeguard database pools against unoptimized queries.

---

## 4. External Integrations Resilience & Circuit Breakers

### 4.1 Circuit Breaker Architecture
External municipal services (BHASHINI translation/speech, NDMA/IMD alert feeds, IRAD crash feeds) are protected by configurable circuit breakers:
- **State Transition:** 
  - `CLOSED` (Normal): Traffic passes through; consecutive failures monitored.
  - `OPEN` (Tripped): When consecutive failures breach the threshold (default: 3–5 failures), requests fail fast to fallback without penalizing caller latency or overloading the upstream provider.
  - `HALF_OPEN` (Probe): After a cooldown interval (default: 10s–15s), a single probe request checks upstream recovery.
- **Graceful Fallback:**
  - Multilingual translations fallback transparently to source text or locale dictionary.
  - Weather/disaster feeds fallback to authoritative cached snapshots with statutory disclaimers.

---

## 5. Backup & Disaster Recovery (DR) Drill

### 5.1 Backup Strategy & RPO/RTO
- **Recovery Point Objective (RPO):** < 15 minutes (continuous WAL archiving + hourly snapshots).
- **Recovery Time Objective (RTO):** < 30 minutes for database restoration to hot-standby replica.
- **Storage Redundancy:** PostgreSQL automated snapshots replicated to geographically distinct storage with AES-256 encryption.

### 5.2 Backup & Restore Procedure
1. **Automated Export (`scripts/backup/db-backup.sh`):**
   ```bash
   pg_dump -Fc --no-acl --no-owner -h $DB_HOST -U $DB_USER $DB_NAME > /backups/civiq-backup-$(date +%Y%m%d%H%M).dump
   ```
2. **Point-in-Time Recovery Drill (`scripts/backup/db-restore.sh`):**
   ```bash
   # Create isolated test recovery database
   createdb -h $DB_HOST -U $DB_USER civiq_restore_test
   pg_restore -h $DB_HOST -U $DB_USER -d civiq_restore_test /backups/latest.dump
   # Run verification queries on schema integrity, issue counts, and foreign key relations
   ```
3. **Dry-Run Drill Verification:**
   - Simulated node failure and automated failover validation executed monthly.
   - Restored database integrity verified against schema checksums.
