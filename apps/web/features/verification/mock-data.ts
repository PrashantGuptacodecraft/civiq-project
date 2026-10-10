// Mock data types matching the Prisma schema contracts
// This file provides deterministic demo data for the verification console.
// In production, these would come from API calls to the backend services.

export type VerificationStatus =
  | 'PENDING'
  | 'IN_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SUSPICIOUS'
  | 'NEEDS_EVIDENCE'
  | 'DUPLICATE';

export type IssueSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TrustLevel = 'NEW' | 'ESTABLISHED' | 'TRUSTED' | 'FLAGGED' | 'SUSPENDED';

export interface MockEvidence {
  id: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  metadataTrusted: boolean;
  capturedAt: string | null;
}

export interface MockRiskSignal {
  signalType: string;
  severity: string;
  createdAt: string;
}

export interface MockReporter {
  id: string;
  displayName: string;
  trustLevel: TrustLevel;
  trustScore: number;
  validReports: number;
  rejectedReports: number;
}

export interface MockIssue {
  id: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  verificationStatus: VerificationStatus;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  city: string | null;
  state: string | null;
  district: string | null;
  createdAt: string;
  reporter: MockReporter;
  evidence: MockEvidence[];
  riskSignals: MockRiskSignal[];
  aiRecommendation: string | null;
  duplicateCandidateCount: number;
}

export const MOCK_ISSUES: MockIssue[] = [
  {
    id: 'iss_01',
    title: 'Large pothole causing accidents on MG Road',
    description: 'A 3-foot wide pothole has formed near the MG Road bus stop. Multiple two-wheeler accidents reported in the past week. Requires immediate repair.',
    severity: 'HIGH',
    verificationStatus: 'PENDING',
    latitude: 12.9716,
    longitude: 77.5946,
    address: 'MG Road, Near Bus Stop',
    city: 'Bengaluru',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    createdAt: '2026-10-09T08:30:00Z',
    reporter: {
      id: 'u_01',
      displayName: 'Rajesh K.',
      trustLevel: 'ESTABLISHED',
      trustScore: 85,
      validReports: 12,
      rejectedReports: 1,
    },
    evidence: [
      { id: 'ev_01', storageKey: 'uploads/pothole_mg_road.jpg', mimeType: 'image/jpeg', sizeBytes: 245000, metadataTrusted: false, capturedAt: '2026-10-09T08:15:00Z' },
      { id: 'ev_02', storageKey: 'uploads/pothole_mg_road_2.jpg', mimeType: 'image/jpeg', sizeBytes: 312000, metadataTrusted: false, capturedAt: '2026-10-09T08:16:00Z' },
    ],
    riskSignals: [],
    aiRecommendation: 'High confidence genuine report. Location matches known infrastructure hotspot. Reporter has strong track record.',
    duplicateCandidateCount: 0,
  },
  {
    id: 'iss_02',
    title: 'Illegal garbage dumping near river',
    description: 'Construction debris and household waste being dumped along the river bank near sector 15. Affecting water quality and causing foul smell.',
    severity: 'CRITICAL',
    verificationStatus: 'SUSPICIOUS',
    latitude: 28.6139,
    longitude: 77.2090,
    address: 'Sector 15, Near River Bank',
    city: 'Noida',
    state: 'Uttar Pradesh',
    district: 'Gautam Buddha Nagar',
    createdAt: '2026-10-08T14:20:00Z',
    reporter: {
      id: 'u_02',
      displayName: 'Priya S.',
      trustLevel: 'FLAGGED',
      trustScore: 25,
      validReports: 2,
      rejectedReports: 4,
    },
    evidence: [
      { id: 'ev_03', storageKey: 'uploads/garbage_river.jpg', mimeType: 'image/jpeg', sizeBytes: 189000, metadataTrusted: false, capturedAt: null },
    ],
    riskSignals: [
      { signalType: 'BURST_REPORTING', severity: 'HIGH', createdAt: '2026-10-08T14:25:00Z' },
    ],
    aiRecommendation: 'Flagged: Reporter has elevated rejection rate. Evidence EXIF data missing. Recommend requesting additional evidence before verification.',
    duplicateCandidateCount: 2,
  },
  {
    id: 'iss_03',
    title: 'Streetlight outage in residential colony',
    description: 'All streetlights in Block C of Vasant Kunj have been off for 3 days. Safety concern for residents, especially women and children.',
    severity: 'MEDIUM',
    verificationStatus: 'NEEDS_EVIDENCE',
    latitude: 28.5194,
    longitude: 77.1567,
    address: 'Block C, Vasant Kunj',
    city: 'New Delhi',
    state: 'Delhi',
    district: 'South West Delhi',
    createdAt: '2026-10-07T19:45:00Z',
    reporter: {
      id: 'u_03',
      displayName: 'Amit V.',
      trustLevel: 'NEW',
      trustScore: 50,
      validReports: 0,
      rejectedReports: 0,
    },
    evidence: [],
    riskSignals: [],
    aiRecommendation: 'New reporter with no history. No evidence attached. Recommend requesting photo/video evidence of the outage.',
    duplicateCandidateCount: 0,
  },
  {
    id: 'iss_04',
    title: 'Broken water main flooding street',
    description: 'Major water pipe burst on 5th Cross Road. Clean water wasting rapidly and street is flooded. Needs emergency municipal response.',
    severity: 'CRITICAL',
    verificationStatus: 'PENDING',
    latitude: 12.9352,
    longitude: 77.6245,
    address: '5th Cross Road, Koramangala',
    city: 'Bengaluru',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    createdAt: '2026-10-10T06:10:00Z',
    reporter: {
      id: 'u_04',
      displayName: 'Meera R.',
      trustLevel: 'TRUSTED',
      trustScore: 155,
      validReports: 23,
      rejectedReports: 0,
    },
    evidence: [
      { id: 'ev_04', storageKey: 'uploads/water_main_burst.mp4', mimeType: 'video/mp4', sizeBytes: 8500000, metadataTrusted: false, capturedAt: '2026-10-10T06:05:00Z' },
      { id: 'ev_05', storageKey: 'uploads/water_main_burst_2.jpg', mimeType: 'image/jpeg', sizeBytes: 420000, metadataTrusted: false, capturedAt: '2026-10-10T06:06:00Z' },
    ],
    riskSignals: [],
    aiRecommendation: 'High priority. Trusted reporter with excellent track record. Video evidence supports claim. Recommend fast-tracking to VERIFIED.',
    duplicateCandidateCount: 1,
  },
  {
    id: 'iss_05',
    title: 'Repeated noise complaint — same user',
    description: 'Loud construction noise after 10 PM every night from the site near plot 42.',
    severity: 'LOW',
    verificationStatus: 'DUPLICATE',
    latitude: 19.0760,
    longitude: 72.8777,
    address: 'Plot 42, Andheri West',
    city: 'Mumbai',
    state: 'Maharashtra',
    district: 'Mumbai Suburban',
    createdAt: '2026-10-06T22:30:00Z',
    reporter: {
      id: 'u_05',
      displayName: 'Vikram P.',
      trustLevel: 'ESTABLISHED',
      trustScore: 90,
      validReports: 8,
      rejectedReports: 0,
    },
    evidence: [
      { id: 'ev_06', storageKey: 'uploads/noise_recording.mp3', mimeType: 'audio/mpeg', sizeBytes: 1200000, metadataTrusted: false, capturedAt: '2026-10-06T22:25:00Z' },
    ],
    riskSignals: [
      { signalType: 'REPEATED_MEDIA', severity: 'MEDIUM', createdAt: '2026-10-06T22:35:00Z' },
    ],
    aiRecommendation: 'Likely duplicate of issue iss_noise_042. Same location, same reporter, similar timeframe. Audio hash matches previous submission.',
    duplicateCandidateCount: 3,
  },
];
