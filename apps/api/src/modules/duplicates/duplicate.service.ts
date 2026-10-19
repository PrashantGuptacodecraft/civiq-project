import { prisma, Issue } from '@civiq/db';
import { duplicateEvidenceStore, StoredDuplicatePair } from './duplicate.store';

export interface DuplicateCandidate {
  issueId: string;
  totalScore: number;
  explanation: string;
  isHighImpact: boolean; // Requires human confirmation
  geoScore?: number;
  timeScore?: number;
  textScore?: number;
  imageScore?: number | null;
  decisionEvidence?: Record<string, unknown>;
}

export interface IssueWithEvidence extends Issue {
  evidence?: Array<{ perceptualHash?: string | null }> | undefined;
}

/**
 * Computes dense subword n-gram embedding vector for text semantic similarity.
 */
export function computeTextEmbedding(text: string, dimension = 128): number[] {
  const norm = text
    .toLowerCase()
    .replace(/[^\w\s]|_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const vec = new Array(dimension).fill(0);
  if (!norm) return vec;

  const words = norm.split(' ');
  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash + word.charCodeAt(i)) | 0;
    }
    const idx = Math.abs(hash) % dimension;
    vec[idx] += 2.0;

    // Subword trigrams for morphological and typo resilience
    const padded = `<${word}>`;
    for (let i = 0; i < padded.length - 2; i++) {
      const tri = padded.slice(i, i + 3);
      let triHash = 0;
      for (let j = 0; j < tri.length; j++) {
        triHash = ((triHash << 5) - triHash + tri.charCodeAt(j)) | 0;
      }
      vec[Math.abs(triHash) % dimension] += 0.5;
    }
  }

  let sumSq = 0;
  for (const v of vec) sumSq += v * v;
  const mag = Math.sqrt(sumSq);
  return mag > 0 ? vec.map((v) => v / mag) : vec;
}

/**
 * Cosine similarity between two dense embedding vectors.
 */
export function computeCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA.length || !vecB.length || vecA.length !== vecB.length) return 0;
  let dot = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += (vecA[i] || 0) * (vecB[i] || 0);
  }
  return Math.max(0, Math.min(1, dot));
}

/**
 * Bitwise Hamming distance similarity between perceptual hashes (0.0 to 1.0).
 */
export function calculatePerceptualHashSimilarity(
  hashA?: string | null,
  hashB?: string | null
): number | null {
  if (!hashA || !hashB) return null;
  const cleanA = hashA.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
  const cleanB = hashB.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
  const len = Math.min(cleanA.length, cleanB.length);
  if (len === 0) return null;

  let diffBits = 0;
  for (let i = 0; i < len; i++) {
    const a = parseInt(cleanA[i]!, 16);
    const b = parseInt(cleanB[i]!, 16);
    let xor = a ^ b;
    while (xor > 0) {
      if (xor & 1) diffBits++;
      xor >>= 1;
    }
  }
  return Math.max(0, 1 - diffBits / (len * 4));
}

export class DuplicateDetectionEngine {
  private readonly GEO_WEIGHT = 0.5;
  private readonly TEXT_WEIGHT = 0.3;
  private readonly TIME_WEIGHT = 0.2;
  private readonly THRESHOLD = 0.65;
  private readonly HIGH_IMPACT_THRESHOLD = 0.85;
  private readonly MAX_DISTANCE_KM = 0.5; // 500 meters
  private readonly MAX_TIME_DIFF_DAYS = 7;

  /**
   * Main entry point to find duplicate candidates for a target issue.
   * Compares against recently submitted issues in the database using
   * an embedding + perceptual hash + spatial-temporal transparent ensemble.
   */
  async findDuplicateCandidates(issueId: string): Promise<DuplicateCandidate[]> {
    const target = await prisma.issue.findUnique({
      where: { id: issueId },
    });
    if (!target) throw new Error('Issue not found');

    const timeThreshold = new Date(
      target.createdAt.getTime() - this.MAX_TIME_DIFF_DAYS * 24 * 60 * 60 * 1000
    );
    const candidatesDb = await prisma.issue.findMany({
      where: {
        id: { not: issueId },
        createdAt: { gte: timeThreshold },
        status: { notIn: ['CLOSED', 'REOPENED'] },
      },
    });

    const results: DuplicateCandidate[] = [];

    for (const candidate of candidatesDb) {
      const scored = this.scorePair(target, candidate);

      if (scored.totalScore >= this.THRESHOLD) {
        results.push(scored);

        // Store candidate pair and decision evidence
        await duplicateEvidenceStore.recordCandidatePair({
          targetIssueId: target.id,
          candidateIssueId: candidate.id,
          totalScore: scored.totalScore,
          isHighImpact: scored.isHighImpact,
          explanation: scored.explanation,
          decisionEvidence: scored.decisionEvidence || {},
        });
      }
    }

    return results.sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Transparent ensemble scoring for two issues.
   */
  scorePair(
    target: IssueWithEvidence,
    candidate: IssueWithEvidence,
    targetHash?: string | null,
    candidateHash?: string | null
  ): DuplicateCandidate {
    const geoScore = this.calculateGeoScore(target, candidate);
    const timeScore = this.calculateTimeScore(target, candidate);
    const textScore = this.calculateTextScore(target, candidate);

    // Extract perceptual hashes from evidence if present
    const hashA = targetHash ?? target.evidence?.[0]?.perceptualHash;
    const hashB = candidateHash ?? candidate.evidence?.[0]?.perceptualHash;
    const imageScore = calculatePerceptualHashSimilarity(hashA, hashB);

    // Dynamic transparent weights
    let totalScore: number;
    let weightsUsed: Record<string, number>;

    if (imageScore !== null) {
      // 4-signal ensemble: geo: 0.35, text: 0.35, image: 0.15, time: 0.15
      const wGeo = 0.35;
      const wText = 0.35;
      const wImage = 0.15;
      const wTime = 0.15;
      totalScore = geoScore * wGeo + textScore * wText + imageScore * wImage + timeScore * wTime;
      weightsUsed = { geo: wGeo, text: wText, image: wImage, time: wTime };
    } else {
      // 3-signal baseline weights: geo: 0.50, text: 0.30, time: 0.20
      totalScore =
        geoScore * this.GEO_WEIGHT + textScore * this.TEXT_WEIGHT + timeScore * this.TIME_WEIGHT;
      weightsUsed = { geo: this.GEO_WEIGHT, text: this.TEXT_WEIGHT, time: this.TIME_WEIGHT };
    }

    const isHighImpact = totalScore >= this.HIGH_IMPACT_THRESHOLD;
    const reasons: string[] = [];
    if (geoScore > 0.8) reasons.push('Location is nearly identical');
    if (textScore > 0.6) reasons.push('Text descriptions match significantly');
    if (timeScore > 0.8) reasons.push('Reported around the same time');
    if (imageScore !== null && imageScore > 0.75) reasons.push('Image evidence matches visually');

    const explanation = reasons.join(', ') || 'General similarity exceeded threshold';

    const decisionEvidence = {
      targetId: target.id,
      candidateId: candidate.id,
      totalScore: Number(totalScore.toFixed(4)),
      isHighImpact,
      weightsUsed,
      components: {
        geo: Number(geoScore.toFixed(4)),
        text: Number(textScore.toFixed(4)),
        time: Number(timeScore.toFixed(4)),
        image: imageScore !== null ? Number(imageScore.toFixed(4)) : null,
      },
    };

    return {
      issueId: candidate.id,
      totalScore,
      explanation,
      isHighImpact,
      geoScore,
      timeScore,
      textScore,
      imageScore,
      decisionEvidence,
    };
  }

  /**
   * Retrieve stored candidate pairs for an issue.
   */
  getCandidatePairs(issueId: string): StoredDuplicatePair[] {
    return duplicateEvidenceStore.getCandidatePairsForIssue(issueId);
  }

  /**
   * Confirm a duplicate pair (human confirmation for high-impact duplicates).
   */
  async confirmCandidate(pairId: string, reviewedById: string): Promise<StoredDuplicatePair | undefined> {
    return duplicateEvidenceStore.confirmDuplicate(pairId, reviewedById);
  }

  /**
   * Dismiss a false-positive candidate pair.
   */
  async dismissCandidate(pairId: string, reviewedById: string): Promise<StoredDuplicatePair | undefined> {
    return duplicateEvidenceStore.dismissDuplicate(pairId, reviewedById);
  }

  /**
   * Haversine formula mapped to a 0-1 score
   */
  private calculateGeoScore(a: Issue, b: Issue): number {
    if (!a.latitude || !a.longitude || !b.latitude || !b.longitude) {
      return 0; // Cannot compare
    }

    const distanceKm = this.haversine(a.latitude, a.longitude, b.latitude, b.longitude);
    if (distanceKm > this.MAX_DISTANCE_KM) return 0.0;

    // Scale distance to a 1.0 to 0.0 score (0km = 1.0, 0.5km = 0.0)
    return Math.max(0, 1 - distanceKm / this.MAX_DISTANCE_KM);
  }

  /**
   * Time decay mapped to a 0-1 score
   */
  private calculateTimeScore(a: Issue, b: Issue): number {
    const diffMs = Math.abs(a.createdAt.getTime() - b.createdAt.getTime());
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays > this.MAX_TIME_DIFF_DAYS) return 0.0;

    // Scale days to a 1.0 to 0.0 score (0 days = 1.0, 7 days = 0.0)
    return Math.max(0, 1 - diffDays / this.MAX_TIME_DIFF_DAYS);
  }

  /**
   * Semantic embedding + Jaccard hybrid text score (0.0 to 1.0)
   */
  private calculateTextScore(a: Issue, b: Issue): number {
    const textA = this.normalizeText(`${a.title} ${a.description}`);
    const textB = this.normalizeText(`${b.title} ${b.description}`);

    // 1. Jaccard token overlap
    const setA = new Set(textA.split(' '));
    const setB = new Set(textB.split(' '));

    let jaccard = 0;
    if (setA.size > 0 || setB.size > 0) {
      const intersection = new Set([...setA].filter((x) => setB.has(x)));
      const union = new Set([...setA, ...setB]);
      jaccard = union.size > 0 ? intersection.size / union.size : 0;
    }

    // 2. Subword dense n-gram embedding cosine similarity
    const embA = computeTextEmbedding(textA);
    const embB = computeTextEmbedding(textB);
    const embeddingSim = computeCosineSimilarity(embA, embB);

    // Blend: max of jaccard and embedding, or weighted blend
    return Math.max(jaccard, embeddingSim * 0.95);
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]|_/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Remove extra spaces
      .trim();
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const duplicateEngine = new DuplicateDetectionEngine();
