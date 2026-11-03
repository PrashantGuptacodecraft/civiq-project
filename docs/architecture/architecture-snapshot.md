# CivIQ Architecture Snapshot (Release v1.0.0-pilot)

```
                       ┌─────────────────────────────────────────┐
                       │     CITIZENS & EMERGENCY RESPONDERS    │
                       └────────────────────┬────────────────────┘
                                            │ HTTPS / WSS
                                            ▼
                       ┌─────────────────────────────────────────┐
                       │   Reverse Proxy / Security Headers /   │
                       │     Sliding-Window Rate Limiting        │
                       └────────────────────┬────────────────────┘
                                            │
        ┌───────────────────────────────────┼───────────────────────────────────┐
        ▼                                   ▼                                   ▼
┌──────────────────┐               ┌──────────────────┐               ┌──────────────────┐
│  Citizen Web &   │               │ Mobile Field App │               │ Emergency Ops &  │
│  Multilingual    │               │ (Offline Sync &  │               │ Situation Room   │
│  Voice Portal    │               │  Delta Storage)  │               │ (GIS & Alerts)   │
└───────────────┬──┘               └────────┬─────────┘               └────────┬─────────┘
                │                           │                                  │
                └───────────────────────────┼──────────────────────────────────┘
                                            ▼
                    ┌─────────────────────────────────────────────────┐
                    │          CivIQ Node.js / Express API            │
                    │   - RBAC & Scoped Jurisdiction Resolution       │
                    │   - Query Budget & Safe Caching (TTL)           │
                    │   - Circuit Breakers for External Integrations  │
                    │   - /metrics SRE Latency Percentile Tracker     │
                    └───────┬─────────────────────────────┬───────────┘
                            │                             │
             ┌──────────────┴──────────────┐              │
             ▼                             ▼              ▼
┌────────────────────────┐   ┌──────────────────────┐   ┌────────────────────────┐
│ PostgreSQL 16 DB       │   │ AI Inference Service │   │ External Integrations  │
│ - Spatial & Comp Index │   │ - NLP Classification │   │ - MeitY BHASHINI (STT) │
│ - Immutable Audit Log  │   │ - Vision Heuristics  │   │ - IMD / NDMA CAP Feeds │
│ - WAL Archive Backups  │   │ - Duplicate Ensemble │   │ - IRAD / 112 Handoff   │
└────────────────────────┘   └──────────────────────┘   └────────────────────────┘
```
