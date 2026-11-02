import { SituationRoomDashboard } from '@/features/situation-room';
import { SEEDED_DISASTER_EVENTS } from '../../../backend/src/modules/disasters/disaster.fixtures.js';
import {
  SEEDED_RESPONSE_TASKS,
  SEEDED_EVENT_TIMELINE,
  SEEDED_POST_EVENT_METRICS,
  SEEDED_AFTER_ACTION_REVIEW,
} from '../../../backend/src/modules/disaster-ops/disaster-ops.fixtures.js';
import { SEEDED_IMPACT_REPORTS } from '../../../backend/src/modules/disaster-impact/disaster-impact.fixtures.js';
import { SEEDED_DISASTER_RESOURCES } from '../../../backend/src/modules/resources/resource.fixtures.js';
import { SEEDED_NEED_REQUESTS } from '../../../backend/src/modules/resource-matching/resource-matching.fixtures.js';

export const metadata = {
  title: 'Disaster Situation Room & Operations Command - CivIQ',
  description:
    'Real-time municipal disaster operations command matrix: alerts, impact clusters, blocked routes, needs, resources, response tasks, and AI-assisted after-action review.',
};

export default function SituationRoomPage() {
  const defaultDisaster = SEEDED_DISASTER_EVENTS[0]; // Khadakwasla / Mutha Flood

  // Compute initial impact clusters
  const clustersMap = new Map();
  for (const rep of SEEDED_IMPACT_REPORTS) {
    const key = rep.impactType;
    if (!clustersMap.has(key)) {
      clustersMap.set(key, {
        impactType: key,
        count: 0,
        criticalCount: 0,
        peopleAffectedEstimated: 0,
        strandedPersonsCount: 0,
        reports: [],
      });
    }
    const cluster = clustersMap.get(key);
    cluster.count += 1;
    if (rep.severity === 'CRITICAL_LIFE_SAFETY') cluster.criticalCount += 1;
    cluster.peopleAffectedEstimated += rep.impactDetails?.peopleAffectedEstimated || 0;
    cluster.strandedPersonsCount += rep.impactDetails?.strandedPersonsCount || 0;
    cluster.reports.push(rep);
  }

  const blockedRoutes = SEEDED_IMPACT_REPORTS
    .filter((r) => r.impactType === 'BLOCKED_ROAD_DEBRIS' || r.impactDetails?.roadPassable === false)
    .map((r) => ({
      reportId: r.reportId,
      location: r.location,
      waterDepthMeters: r.impactDetails?.waterDepthMeters || null,
      title: r.impactDetails?.title || 'Route Blockage',
      description: r.impactDetails?.description || '',
      status: r.status,
      reportedAt: r.reportedAt,
    }));

  return (
    <SituationRoomDashboard
      initialDisaster={defaultDisaster}
      initialAlerts={defaultDisaster.officialAlertReferences || []}
      initialImpactClusters={Array.from(clustersMap.values())}
      initialBlockedRoutes={blockedRoutes}
      initialNeeds={SEEDED_NEED_REQUESTS}
      initialResources={SEEDED_DISASTER_RESOURCES}
      initialResponseTasks={SEEDED_RESPONSE_TASKS}
      initialTimeline={SEEDED_EVENT_TIMELINE}
      initialMetrics={SEEDED_POST_EVENT_METRICS}
      initialAar={SEEDED_AFTER_ACTION_REVIEW}
    />
  );
}
