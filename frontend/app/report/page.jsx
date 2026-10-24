import { CitizenReportForm } from '@/features/reporting';

export const metadata = {
  title: 'Report an Issue - CivIQ',
  description: 'Submit verified civic reports for roads, drainage, water, sanitation, and municipal services.',
};

export default function ReportPage() {
  return <CitizenReportForm />;
}