# Disaster UX Specification

Define disaster mode UI patterns:

1. Active disaster banner:
   - Full-width, high-visibility banner at top of all pages
   - Disaster name, severity, affected area summary
   - Dismissible but re-accessible
   - Color-coded by severity

2. Affected areas:
   - Map overlay showing disaster zone polygon
   - Impact severity gradient
   - Blocked roads marked
   - Safe routes highlighted

3. Incident clusters:
   - Group related reports by geographic area
   - Show cluster severity rollup
   - Expand to individual reports

4. Resource visualization:
   - Shelter: location, capacity, current occupancy, status
   - Medical: hospital/post location, availability, specialties
   - Supplies: distribution point, available items, schedule
   - Teams: deployed location, status, assignment

5. Situation room layout:
   - Map as primary view (full width)
   - Collapsible panels: alerts, impact feed, resources, tasks
   - Real-time update indicators
   - Communication controls

6. Active incident mode:
   - Simplify UI: remove non-essential navigation
   - Prioritize: alerts, impact reports, resource status
   - Reduce decoration, maximize information density
   - Optimize for low bandwidth (compressed images, minimal JS)
   - Support poor network conditions

7. After-action analysis:
   - Timeline of events
   - Response metrics
   - Resource utilization
   - Lessons learned template
