import { HotspotAnalytics } from '../../features/analytics/index.js';

export const metadata = {
  title: 'Hotspot Analytics — CivIQ',
  description: 'Detect geographic concentration of incidents using configurable spatial windows and temporal trends.',
};

export default function AnalyticsPage() {
  return (
    <div className="flex-1 w-full bg-surface-primary">
      <HotspotAnalytics />
    </div>
  );
}
