import { IncidentResponseDashboard } from '@/features/incidents';

export const metadata = {
  title: 'Emergency Incident Response - CivIQ',
  description:
    'Rapid accident reporting, Call 112 emergency handoff, unverified intake, responder confirmation, and incident timeline.',
};

export default function IncidentsPage() {
  return <IncidentResponseDashboard />;
}
