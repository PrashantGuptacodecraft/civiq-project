import { prisma, Issue } from '@civiq/db';

export interface DuplicateCandidate {
  issueId: string;
  totalScore: number;
  explanation: string;
  isHighImpact: boolean; // Requires human confirmation
}

export class DuplicateDetectionEngine {
  private readonly GEO_WEIGHT = 0.5;
  private readonly TEXT_WEIGHT = 0.3;
  private readonly TIME_WEIGHT = 0.2;
  private readonly THRESHOLD = 0.65;
  private readonly MAX_DISTANCE_KM = 0.5; // 500 meters
  private readonly MAX_TIME_DIFF_DAYS = 7;

  /**
   * Main entry point to find duplicate candidates for a target issue.
   * Compares against recently submitted issues in the database.
   */
  async findDuplicateCandidates(issueId: string): Promise<DuplicateCandidate[]> {
    const target = await prisma.issue.findUnique({ where: { id: issueId } });
    if (!target) throw new Error('Issue not found');

    // Optimization: query only issues from the last 7 days to avoid full table scan
    const timeThreshold = new Date(target.createdAt.getTime() - this.MAX_TIME_DIFF_DAYS * 24 * 60 * 60 * 1000);
    const candidatesDb = await prisma.issue.findMany({
      where: {
        id: { not: issueId },
        createdAt: { gte: timeThreshold },
        status: { notIn: ['CLOSED', 'REOPENED'] }
      }
    });

    const results: DuplicateCandidate[] = [];

    for (const candidate of candidatesDb) {
      const geoScore = this.calculateGeoScore(target, candidate);
      const timeScore = this.calculateTimeScore(target, candidate);
      const textScore = this.calculateTextScore(target, candidate);

      const totalScore = 
        (geoScore * this.GEO_WEIGHT) + 
        (textScore * this.TEXT_WEIGHT) + 
        (timeScore * this.TIME_WEIGHT);

      if (totalScore >= this.THRESHOLD) {
        const isHighImpact = totalScore >= 0.85;
        const reasons = [];
        if (geoScore > 0.8) reasons.push('Location is nearly identical');
        if (textScore > 0.6) reasons.push('Text descriptions match significantly');
        if (timeScore > 0.8) reasons.push('Reported around the same time');
        
        results.push({
          issueId: candidate.id,
          totalScore,
          explanation: reasons.join(', ') || 'General similarity exceeded threshold',
          isHighImpact
        });
      }
    }

    return results.sort((a, b) => b.totalScore - a.totalScore);
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
    return Math.max(0, 1 - (distanceKm / this.MAX_DISTANCE_KM));
  }

  /**
   * Time decay mapped to a 0-1 score
   */
  private calculateTimeScore(a: Issue, b: Issue): number {
    const diffMs = Math.abs(a.createdAt.getTime() - b.createdAt.getTime());
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    if (diffDays > this.MAX_TIME_DIFF_DAYS) return 0.0;
    
    // Scale days to a 1.0 to 0.0 score (0 days = 1.0, 7 days = 0.0)
    return Math.max(0, 1 - (diffDays / this.MAX_TIME_DIFF_DAYS));
  }

  /**
   * Jaccard index for normalized text similarity
   */
  private calculateTextScore(a: Issue, b: Issue): number {
    const textA = this.normalizeText(`${a.title} ${a.description}`);
    const textB = this.normalizeText(`${b.title} ${b.description}`);
    
    const setA = new Set(textA.split(' '));
    const setB = new Set(textB.split(' '));
    
    if (setA.size === 0 && setB.size === 0) return 0;

    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    
    return intersection.size / union.size;
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]|_/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')      // Remove extra spaces
      .trim();
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}

export const duplicateEngine = new DuplicateDetectionEngine();
