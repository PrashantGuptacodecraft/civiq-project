import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DuplicateDetectionEngine } from './duplicate.service';
import { prisma } from '@civiq/db';

vi.mock('@civiq/db', () => ({
  prisma: {
    issue: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('DuplicateDetectionEngine', () => {
  const engine = new DuplicateDetectionEngine();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should flag obvious duplicate (same geo, exact text, same day)', async () => {
    const target = {
      id: 'iss1',
      title: 'Pothole on Main St',
      description: 'Huge pothole damaging cars.',
      latitude: 28.6139,
      longitude: 77.2090,
      createdAt: new Date('2025-01-01T12:00:00Z')
    };

    const candidate = {
      id: 'iss2',
      title: 'Massive pothole on Main St',
      description: 'Huge pothole damaging cars please fix.',
      latitude: 28.6140, // Barely moved
      longitude: 77.2090,
      createdAt: new Date('2025-01-01T12:30:00Z')
    };

    vi.mocked(prisma.issue.findUnique).mockResolvedValue(target as any);
    vi.mocked(prisma.issue.findMany).mockResolvedValue([candidate] as any);

    const results = await engine.findDuplicateCandidates('iss1');
    expect(results).toHaveLength(1);
    expect(results[0]?.issueId).toBe('iss2');
    expect(results[0]?.totalScore).toBeGreaterThan(0.85);
    expect(results[0]?.isHighImpact).toBe(true);
  });

  it('should not flag completely unrelated issues (false negative avoidance)', async () => {
    const target = {
      id: 'iss1',
      title: 'Pothole',
      description: 'Bad road.',
      latitude: 28.6139,
      longitude: 77.2090,
      createdAt: new Date('2025-01-01T12:00:00Z')
    };

    const candidate = {
      id: 'iss3',
      title: 'Broken Streetlight',
      description: 'Light is out on 5th avenue.',
      latitude: 19.0760, // Mumbai vs Delhi
      longitude: 72.8777,
      createdAt: new Date('2025-01-05T12:00:00Z')
    };

    vi.mocked(prisma.issue.findUnique).mockResolvedValue(target as any);
    vi.mocked(prisma.issue.findMany).mockResolvedValue([candidate] as any);

    const results = await engine.findDuplicateCandidates('iss1');
    expect(results).toHaveLength(0); // Score is effectively 0
  });

  it('should handle missing GPS cleanly', async () => {
    const target = {
      id: 'iss1',
      title: 'Pothole',
      description: 'Bad road.',
      latitude: null,
      longitude: null,
      createdAt: new Date('2025-01-01T12:00:00Z')
    };

    const candidate = {
      id: 'iss4',
      title: 'Pothole',
      description: 'Bad road.',
      latitude: null,
      longitude: null,
      createdAt: new Date('2025-01-01T13:00:00Z')
    };

    vi.mocked(prisma.issue.findUnique).mockResolvedValue(target as any);
    vi.mocked(prisma.issue.findMany).mockResolvedValue([candidate] as any);

    const results = await engine.findDuplicateCandidates('iss1');
    // Because Geo weight is 50%, missing GPS means max score is 50%, threshold is 65%.
    expect(results).toHaveLength(0);
  });
});
