import { FieldWorkerConsole } from '@/features/field';
export const metadata = {
    title: 'Field Worker Console - CivIQ',
    description: 'Mobile-first task execution, navigation, and field reporting for municipal workers.',
    manifest: '/manifest.json',
};

export const viewport = {
    themeColor: '#2563EB',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};
export default function FieldWorkerPage() {
    return <FieldWorkerConsole />;
}
