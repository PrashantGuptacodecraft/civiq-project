import { DisasterReportingPageContent } from '@/features/disaster-reporting';

export const metadata = {
  title: 'Disaster Impact Reporting - CivIQ',
  description:
    'Citizen and field worker ground impact reporting for urban flooding, blocked roads, outages, stranded persons, and relief supplies.',
};

export default function DisasterReportingPage() {
  return <DisasterReportingPageContent />;
}
