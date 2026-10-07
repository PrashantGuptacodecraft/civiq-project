# Map UX Specification

Define the CivIQ map UX:

1. Provider: Use a map provider adapter (Mapbox or Google Maps). Provider must be swappable.

2. Marker types:
   - Civic issue: Circle marker with category icon
   - Incident/accident: Triangle/diamond warning marker
   - Disaster impact: Alert marker with severity color
   - Field worker location: Person pin (only visible to supervisors)
   - Shelter/resource: Square marker with resource type icon
   - Asset: Infrastructure pin with health color

3. Severity/status visual encoding:
   - Use status colors from DESIGN-SYSTEM.md
   - Size variation for priority (larger = higher priority)
   - Pulse animation for active emergencies (respects reduced-motion)

4. Clustering: Cluster markers when zoomed out. Show count. Color by dominant status. Expand on tap.

5. Map layers (toggleable):
   - Issues (by category)
   - Incidents
   - Assets
   - Disaster zones
   - Hotspots (heat map overlay)
   - Shelters/resources
   - Field workers (supervisor view)

6. Bottom sheet behavior (mobile):
   - Tapping a marker opens bottom sheet with item preview
   - Snap points: peek (25%), half (50%), full (90%)
   - Drag handle visible
   - Swipe down to dismiss
   - Sheet content: summary, status, photo thumbnail, actions

7. Side panel behavior (desktop):
   - Clicking a marker opens side panel
   - Panel shows full detail
   - Panel can be resized
   - Map adjusts visible area

8. List/map synchronization:
   - Toggle between list and map views
   - Selecting item in list highlights on map and vice versa
   - Filters apply to both views simultaneously
   - URL reflects current view state

9. Mobile map controls:
   - Zoom: pinch gesture + floating +/- buttons
   - My location: GPS button
   - Recenter: floating button
   - Layer toggle: bottom-left floating menu
   - Touch target: all map controls minimum 44x44px

10. Accessible non-map alternative:
    - Every map view MUST have a list/table alternative
    - List shows same data with location as text address
    - Screen readers can access all information without map
    - Filter and sort available in list view

11. Performance:
    - Lazy-load map component
    - Limit visible markers (paginate/viewport-query)
    - Use vector tiles where possible
    - Debounce map move events
