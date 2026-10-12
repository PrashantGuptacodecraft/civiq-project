export interface ReportFormValues {
  title: string;
  description: string;
  categoryId: string;
  jurisdictionId: string;
  address: string;
  state: string;
  district: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  source: string;
  files: Array<{
    name: string;
    size: number;
    type: string;
    previewUrl?: string;
  }>;
}

export interface SubmittedIssue {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  jurisdictionId: string;
  status: string;
  verificationStatus: string;
  severity: string;
  slaDays: number;
  department: string;
  address: string | null;
  createdAt: string;
}

export type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';
