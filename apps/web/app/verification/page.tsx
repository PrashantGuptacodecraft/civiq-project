import type { Metadata } from 'next';
import { VerificationConsole } from '@/features/verification';

export const metadata: Metadata = {
  title: 'Verification Console - CivIQ',
  description: 'Review and verify pending civic issue reports.',
};

export default function VerificationPage() {
  return <VerificationConsole />;
}
