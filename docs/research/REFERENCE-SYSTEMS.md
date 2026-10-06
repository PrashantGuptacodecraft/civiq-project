# Research & Interoperability Reference

These are reference systems/standards CivIQ is designed to coexist with or integrate through adapters where officially permitted.

| Area | Reference | Use in CivIQ |
|---|---|---|
| Public grievances | CPGRAMS / PG Portal | Understand grievance lifecycle, organization routing, feedback/appeals and AI-assisted analysis boundary |
| Emergency response | 112 ERSS | Official emergency handoff; never position CivIQ as replacement |
| Disaster alerts | NDMA SACHET | Official geo-targeted alerts; CivIQ consumes/links to alerts and adds ground situation intelligence |
| Accident data | iRAD/eDAR | Reference for road-accident ecosystem; CivIQ focuses on incident intake/correlation rather than replacing the system |
| Urban command | ICCC maturity guidance | Reference for SLA, GIS, analytics, escalation and operations concepts |
| Urban data | IUDX | Adapter/interoperability reference for urban datasets |
| Jurisdiction | Local Government Directory | Reference model for state/district/local-body/ward/panchayat hierarchy and codes |
| Identity | e-Pramaan / MeriPehchaan | Future authorized government identity/SSO adapter |
| Languages | BHASHINI | Indian-language/voice adapter reference |
| Disaster geospatial | ISRO DMS / Bhuvan / NDEM | Future official geospatial-data integration reference |
| Flood information | CWC FloodWatch | Optional official flood-data adapter where access permits |
| Civic API | Open311 GeoReport | API design inspiration for location-based civic service requests |
| Privacy | DPDP Act/Rules | Privacy-by-design and data-governance baseline |

## Source URLs

- https://pgportal.gov.in/
- https://112.gov.in/
- https://sachet.ndma.gov.in/
- https://iudx.org.in/
- https://panchayat.gov.in/en/lgd/
- https://epramaan.gov.in/
- https://meripehchaan.gov.in/
- https://bhashini.gov.in/
- https://www.isro.gov.in/DisasterManagementSupport.html
- https://cwc.gov.in/
- https://wiki.open311.org/GeoReport_v2/
- https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa

## Research rule
Integration docs must always label whether a source is: `official-live`, `official-sandbox`, `developer-test`, or `mock`. Do not represent mock data as official.
