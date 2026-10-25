import { OperationsMapContainer } from '@/features/operations-map';

export const metadata = {
  title: 'Operational Map - CivIQ',
  description: 'Real-time multi-department civic issue tracking, clustering, and jurisdiction boundary management.',
};

export const viewport = {
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
};

export default function OperationalMapPage() {
  return <OperationsMapContainer />;
}
