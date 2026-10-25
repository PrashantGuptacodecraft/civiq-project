import { CommandDashboard } from '@/features/dashboard';

export const metadata = {
  title: 'Authority Command Dashboard - CivIQ',
  description: 'Executive municipal command oversight, KPI intelligence, SLA adherence, and department accountability.',
};

export const viewport = {
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
};

export default function DashboardPage() {
  return <CommandDashboard />;
}
