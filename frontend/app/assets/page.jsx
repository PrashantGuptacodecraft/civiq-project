import { AssetIntelligenceDashboard } from '../../features/assets/index.js';

export const metadata = {
  title: 'Asset Intelligence & Predictive Maintenance — CivIQ',
  description: 'Identify high-recurrence failure clusters, evaluate downtime impact, and prioritize municipal interventions.',
};

export default function AssetsPage() {
  return (
    <div className="flex-1 w-full bg-surface-primary">
      <AssetIntelligenceDashboard />
    </div>
  );
}
