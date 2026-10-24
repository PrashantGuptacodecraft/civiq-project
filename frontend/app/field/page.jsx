import { FieldWorkerConsole } from '@/features/field';

export const metadata = {
  title: 'Field Worker Console - CivIQ',
  description: 'Mobile-first task execution, navigation, and field reporting for municipal workers.',
  manifest: '/manifest.json',
  themeColor: '#2563EB',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function FieldWorkerPage() {
  return <FieldWorkerConsole />;
}