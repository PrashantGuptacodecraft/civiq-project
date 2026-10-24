import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DuplicateDetectionEngine,
  computeTextEmbedding,
  computeCosineSimilarity,
  calculatePerceptualHashSimilarity,
} from './duplicate.service';
import { duplicateEvidenceStore } from './duplicate.store';
import { prisma } from '@civiq/shared-db';

vi.mock('@civiq/db', () => ({
  prisma: {
    issue: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

describe('DuplicateDetectionEngine', () => {
  const engine = new DuplicateDetectionEngine();

  beforeEach(() => {
    vi.clearAllMocks();
    duplicateEvidenceStore.clear();
  });

  it('should flag obvious duplicate (same geo, exact text, same day)', async () => {
    const target = {
      id: 'iss1',
      title: 'Pothole on Main St',
      description: 'Huge pothole damaging cars.',
      latitude: 28.6139,
      longitude: 77.2090,
      createdAt: new Date('2025-01-01T12:00:00Z'),
    };

    const candidate = {
      id: 'iss2',
      title: 'Massive pothole on Main St',
      description: 'Huge pothole damaging cars please fix.',
      latitude: 28.6140, // Barely moved
      longitude: 77.2090,
      createdAt: new Date('2025-01-01T12:30:00Z'),
    };

    vi.mocked(prisma.issue.findUnique).mockResolvedValue(target );
    vi.mocked(prisma.issue.findMany).mockResolvedValue([candidate] );

    const results = await engine.findDuplicateCandidates('iss1');
    expect(results).toHaveLength(1);
    expect(results[0]?.issueId).toBe('iss2');
    expect(results[0]?.totalScore).toBeGreaterThan(0.85);
    expect(results[0]?.isHighImpact).toBe(true);

    // Decision evidence should be populated
    expect(results[0]?.decisionEvidence).toBeDefined();
    expect(results[0]?.decisionEvidence?.components).toBeDefined();

    // Candidate pair should be stored in duplicateEvidenceStore
    const stored = duplicateEvidenceStore.getCandidatePairsForIssue('iss1');
    expect(stored).toHaveLength(1);
    expect(stored[0]?.candidateIssueId).toBe('iss2');
    expect(stored[0]?.status).toBe('PENDING_REVIEW');
  });

  it('should not flag completely unrelated issues (false negative avoidance)', async () => {
    const target = {
      id: 'iss1',
      title: 'Pothole',
      description: 'Bad road.',
      latitude: 28.6139,
      longitude: 77.2090,
      createdAt: new Date('2025-01-01T12:00:00Z'),
    };

    const candidate = {
      id: 'iss3',
      title: 'Broken Streetlight',
      description: 'Light is out on 5th avenue.',
      latitude: 19.0760, // Mumbai vs Delhi
      longitude: 72.8777,
      createdAt: new Date('2025-01-05T12:00:00Z'),
    };

    vi.mocked(prisma.issue.findUnique).mockResolvedValue(target );
    vi.mocked(prisma.issue.findMany).mockResolvedValue([candidate] );

    const results = await engine.findDuplicateCandidates('iss1');
    expect(results).toHaveLength(0); // Score is effectively 0
  });

  it('should handle missing GPS cleanly', async () => {
    const target = {
      id: 'iss1',
      title: 'Pothole',
      description: 'Bad road.',
      latitude,
      longitude,
      createdAt: new Date('2025-01-01T12:00:00Z'),
    };

    const candidate = {
      id: 'iss4',
      title: 'Pothole',
      description: 'Bad road.',
      latitude,
      longitude,
      createdAt: new Date('2025-01-01T13:00:00Z'),
    };

    vi.mocked(prisma.issue.findUnique).mockResolvedValue(target );
    vi.mocked(prisma.issue.findMany).mockResolvedValue([candidate] );

    const results = await engine.findDuplicateCandidates('iss1');
    expect(results).toHaveLength(0);
  });

  it('should detect paraphrased duplicates using text embeddings', () => {
    const textA = 'Severe water pipe burst with clean water gushing onto the road';
    const textB = 'Drinking water pipeline ruptured and flooding the street';

    const embA = computeTextEmbedding(textA);
    const embB = computeTextEmbedding(textB);

    const similarity = computeCosineSimilarity(embA, embB);
    expect(similarity).toBeGreaterThan(0.45);
  });

  it('should compute image perceptual hash similarity accurately', () => {
    // Identical hash -> 1.0
    const hash1 = 'a1b2c3d4e5f67890';
    expect(calculatePerceptualHashSimilarity(hash1, hash1)).toBe(1.0);

    // Minor difference (1 bit difference in 64 bits) -> ~0.984
    const hash2 = 'a1b2c3d4e5f67891';
    const simClose = calculatePerceptualHashSimilarity(hash1, hash2);
    expect(simClose).toBeGreaterThan(0.95);

    // Completely inverted hash -> near 0
    const hashInverted = '5e4d3c2b1a09876f';
    const simFar = calculatePerceptualHashSimilarity(hash1, hashInverted);
    expect(simFar).toBeLessThan(0.60);

    // Null handles gracefully
    expect(calculatePerceptualHashSimilarity(null, hash1)).toBeNull();
  });

  it('should score pair with image perceptual hashes and transparent weights', () => {
    const target = {
      id: 'iss-img-1',
      title: 'Open manhole cover',
      description: 'Dangerous uncovered manhole',
      latitude: 18.5204,
      longitude: 73.8567,
      createdAt: new Date('2025-06-01T10:00:00Z'),
    };

    const candidate = {
      id: 'iss-img-2',
      title: 'Uncovered sewer hole',
      description: 'Manhole open on road',
      latitude: 18.5204, // exact same location
      longitude: 73.8567,
      createdAt: new Date('2025-06-01T10:30:00Z'), // 30 mins apart
    };

    // Both have identical image hash
    const scoreWithImage = engine.scorePair(
      target,
      candidate,
      'ffff0000aaaa5555',
      'ffff0000aaaa5555'
    );

    expect(scoreWithImage.totalScore).toBeGreaterThan(0.85);
    expect(scoreWithImage.isHighImpact).toBe(true);
    expect(scoreWithImage.imageScore).toBe(1.0);
    expect(scoreWithImage.explanation).toContain('Image evidence matches visually');
  });

  it('should store, confirm and dismiss candidate duplicate pairs', async () => {
    const target = {
      id: 'iss-rev-1',
      title: 'Garbage pile dumped',
      description: 'Huge trash dump near corner',
      latitude: 12.9716,
      longitude: 77.5946,
      createdAt: new Date(),
    };

    const candidate = {
      id: 'iss-rev-2',
      title: 'Garbage pile on corner',
      description: 'Trash dump not collected',
      latitude: 12.9717,
      longitude: 77.5947,
      createdAt: new Date(),
    };

    vi.mocked(prisma.issue.findUnique).mockResolvedValue(target);
    vi.mocked(prisma.issue.findMany).mockResolvedValue([candidate]);

    const candidates = await engine.findDuplicateCandidates('iss-rev-1');
    expect(candidates).toHaveLength(1);

    const pairId = 'iss-rev-1_iss-rev-2';
    const storedPairs = engine.getCandidatePairs('iss-rev-1');
    expect(storedPairs).toHaveLength(1);
    expect(storedPairs[0]?.status).toBe('PENDING_REVIEW');

    // Confirm duplicate by reviewer
    const confirmed = await engine.confirmCandidate(pairId, 'officer-99');
    expect(confirmed?.status).toBe('CONFIRMED');
    expect(confirmed?.reviewedById).toBe('officer-99');

    // Dismiss duplicate test
    const dismissed = await engine.dismissCandidate(pairId, 'officer-99');
    expect(dismissed?.status).toBe('DISMISSED');
  });
});