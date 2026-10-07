# ADR 0002: Safety Boundaries and System Scope

## Status
Accepted

## Context
CivIQ is a platform for civic intelligence and operational support, but it operates within a broader ecosystem of established Indian government platforms and emergency response networks.

## Decision
We establish the following strict boundary conditions:
1. **No Replacement of Official Systems:** CivIQ is built to *coexist with* and *augment* existing official systems. It must not be positioned, designed, or deployed as a replacement for 112 (Emergency Response Support System), SACHET (National Disaster Alert System), CPGRAMS (Public Grievance Redressal), or iRAD/eDAR (Integrated Road Accident Database).
2. **Authoritative Sources:** Official alerts and feeds from these established systems remain the absolute authoritative source of truth at all times.
3. **Emergency Handoffs:** Any emergency reports received by CivIQ must immediately trigger an official emergency handoff while retaining an `UNVERIFIED` local status to avoid blocking response efforts.
