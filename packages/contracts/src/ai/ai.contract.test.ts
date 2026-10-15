import { describe, it, expect } from 'vitest';
import {
  AI_GATEWAY_VERSION,
  AI_OPERATIONS,
  AiClassifyRequest,
  AiClassifyResponse,
  AiEvidenceCheckRequest,
  AiEvidenceCheckResponse,
  AiDuplicateScoreRequest,
  AiDuplicateScoreResponse,
  AiPriorityScoreRequest,
  AiPriorityScoreResponse,
  AiRouteRequest,
  AiRouteResponse,
  AiSummarizeRequest,
  AiSummarizeResponse,
  AiPredictRequest,
  AiPredictResponse,
} from './ai.contract';

describe('AI Gateway Contracts - v1 Schema & Types', () => {
  it('exports version and all 7 operations', () => {
    expect(AI_GATEWAY_VERSION).toBe('v1');
    expect(AI_OPERATIONS).toEqual([
      'classify',
      'evidence-check',
      'duplicate-score',
      'priority-score',
      'route',
      'summarize',
      'predict',
    ]);
    expect(AI_OPERATIONS).toHaveLength(7);
  });

  it('validates classify request and response structure', () => {
    const request: AiClassifyRequest = {
      text: 'Huge water logging near Shivaji Nagar market blocking traffic',
      title: 'Water logging issue',
      location: {
        latitude: 18.5204,
        longitude: 73.8567,
        jurisdictionId: 'pune-district',
      },
    };

    const response: AiClassifyResponse = {
      version: AI_GATEWAY_VERSION,
      confidence: 0.94,
      model: {
        name: 'civiq-classifier',
        version: '1.2.0',
        provider: 'mock',
      },
      explanation: 'Text contains high-confidence civic drain and water-logging keywords.',
      latencyMs: 142,
      primaryCategory: 'drainage_flooding',
      predictedSeverity: 'HIGH',
      alternativeCategories: [
        { categoryId: 'roads_waterlogging', confidence: 0.78, reasoning: 'Related road obstruction' },
      ],
      suggestedTags: ['water', 'monsoon', 'traffic-hazard'],
      isEmergencyCandidate: false,
    };

    expect(request.text).toBeDefined();
    expect(response.version).toBe('v1');
    expect(response.confidence).toBeGreaterThan(0);
    expect(response.confidence).toBeLessThanOrEqual(1);
    expect(response.primaryCategory).toBe('drainage_flooding');
    expect(response.predictedSeverity).toBe('HIGH');
  });

  it('validates evidence-check request and response structure', () => {
    const request: AiEvidenceCheckRequest = {
      mimeType: 'image/jpeg',
      issueTitle: 'Pothole on MG Road',
      issueDescription: 'Deep pothole causing accidents',
      mediaStorageKey: 'quarantine/evidence-123.jpg',
    };

    const response: AiEvidenceCheckResponse = {
      version: AI_GATEWAY_VERSION,
      confidence: 0.89,
      model: {
        name: 'civiq-vision-auditor',
        version: '2.0.0',
        provider: 'mock',
      },
      explanation: 'Visual evidence depicts asphalt surface breakdown consistent with road damage.',
      latencyMs: 210,
      isRelevant: true,
      relevanceScore: 0.91,
      qualityScore: 0.85,
      flags: [],
      detectedObjects: ['asphalt', 'hole', 'road'],
      safetyPassed: true,
    };

    expect(request.mimeType).toBe('image/jpeg');
    expect(response.isRelevant).toBe(true);
    expect(response.safetyPassed).toBe(true);
    expect(response.detectedObjects).toContain('asphalt');
  });

  it('validates duplicate-score request and response structure', () => {
    const request: AiDuplicateScoreRequest = {
      targetIssue: {
        id: 'iss-new',
        title: 'Broken streetlight at Crossroad 4',
        description: 'Light pole is damaged and blinking',
        latitude: 18.52,
        longitude: 73.85,
      },
      candidateIssues: [
        {
          id: 'iss-old-1',
          title: 'Street light not working',
          description: 'Dark area near Crossroad 4',
          latitude: 18.5202,
          longitude: 73.8501,
        },
      ],
      threshold: 0.75,
    };

    const response: AiDuplicateScoreResponse = {
      version: AI_GATEWAY_VERSION,
      confidence: 0.92,
      model: {
        name: 'civiq-semantic-embedder',
        version: '1.0.0',
        provider: 'mock',
      },
      explanation: 'Issues are within 30 meters and have high textual similarity.',
      latencyMs: 95,
      isDuplicate: true,
      matchedCandidateId: 'iss-old-1',
      topSimilarityScore: 0.88,
      scoredCandidates: [
        {
          candidateId: 'iss-old-1',
          similarityScore: 0.88,
          semanticSimilarity: 0.85,
          geoDistanceMeters: 22,
          timeDeltaHours: 3.5,
          matchExplanation: 'Close proximity and related complaint',
        },
      ],
    };

    expect(response.isDuplicate).toBe(true);
    expect(response.matchedCandidateId).toBe('iss-old-1');
    expect(response.scoredCandidates[0]?.similarityScore).toBe(0.88);
  });

  it('validates priority-score request and response structure', () => {
    const request: AiPriorityScoreRequest = {
      issueId: 'iss-p1',
      title: 'Exposed live electric cable on sidewalk',
      description: 'Wires hanging near school gate',
      category: 'electrical_hazard',
      severity: 'CRITICAL',
      reporterTrustScore: 85,
      upvotesCount: 12,
      ageHours: 1.5,
    };

    const response: AiPriorityScoreResponse = {
      version: AI_GATEWAY_VERSION,
      confidence: 0.96,
      model: {
        name: 'civiq-priority-engine',
        version: '1.1.0',
        provider: 'mock',
      },
      explanation: 'Life-safety electrical hazard adjacent to vulnerable pedestrian zone.',
      latencyMs: 80,
      priorityScore: 94.5,
      priorityTier: 'P1_CRITICAL',
      scoreBreakdown: {
        hazardScore: 95,
        impactRadiusScore: 90,
        vulnerabilityScore: 98,
        timeDecayFactor: 1.0,
      },
      recommendedSlaHours: 4,
    };

    expect(response.priorityTier).toBe('P1_CRITICAL');
    expect(response.recommendedSlaHours).toBe(4);
    expect(response.scoreBreakdown.hazardScore).toBe(95);
  });

  it('validates route request and response structure', () => {
    const request: AiRouteRequest = {
      issueId: 'iss-r1',
      title: 'Garbage dump overflowing',
      description: 'Solid waste unattended for 5 days',
      categoryId: 'sanitation_waste',
      jurisdictionId: 'ulb-zone-4',
      availableDepartments: [
        { id: 'dept-sanitation', name: 'Solid Waste Management', categories: ['sanitation_waste'] },
        { id: 'dept-roads', name: 'Roads & Infrastructure', categories: ['roads_pothole'] },
      ],
    };

    const response: AiRouteResponse = {
      version: AI_GATEWAY_VERSION,
      confidence: 0.98,
      model: {
        name: 'civiq-router',
        version: '1.0.0',
        provider: 'mock',
      },
      explanation: 'Issue category matches Solid Waste Management jurisdiction.',
      latencyMs: 65,
      recommendedDepartmentId: 'dept-sanitation',
      recommendedDepartmentName: 'Solid Waste Management',
      secondaryDepartmentIds: [],
      routingReason: 'Direct domain category alignment',
    };

    expect(response.recommendedDepartmentId).toBe('dept-sanitation');
    expect(response.recommendedDepartmentName).toBe('Solid Waste Management');
  });

  it('validates summarize request and response structure', () => {
    const request: AiSummarizeRequest = {
      text: 'Long citizen report with 15 follow-up comments and status changes...',
      format: 'EXECUTIVE',
      targetAudience: 'OFFICIAL',
    };

    const response: AiSummarizeResponse = {
      version: AI_GATEWAY_VERSION,
      confidence: 0.9,
      model: {
        name: 'civiq-summarizer',
        version: '1.0.0',
        provider: 'mock',
      },
      explanation: 'Synthesized 15 comments into key progress milestones.',
      latencyMs: 130,
      summary: 'Citizens reported severe road caving; temporary barriers erected; asphalt repair pending.',
      keyPoints: [
        'Reported on Oct 12',
        'Barriers placed by patrol',
        'Awaiting road repair team',
      ],
      language: 'en',
    };

    expect(response.summary).toContain('road caving');
    expect(response.keyPoints).toHaveLength(3);
  });

  it('validates predict request and response structure', () => {
    const request: AiPredictRequest = {
      entityType: 'HOTSPOT',
      entityId: 'hotspot-zone-12',
      historicalMetrics: {
        previousMonthCount: 42,
        unresolvedCount: 14,
        monsoonApproaching: true,
      },
      horizonDays: 14,
    };

    const response: AiPredictResponse = {
      version: AI_GATEWAY_VERSION,
      confidence: 0.86,
      model: {
        name: 'civiq-predictive-risk',
        version: '1.0.0',
        provider: 'mock',
      },
      explanation: 'Historical monsoon data and unresolved drainage issues indicate 82% recurrence risk.',
      latencyMs: 155,
      predictionType: 'HOTSPOT_OVERFLOW_RISK',
      riskProbability: 0.82,
      riskLevel: 'HIGH',
      trend: 'INCREASING',
      contributingFactors: [
        { factor: 'Drainage blockage backlog', weight: 0.45 },
        { factor: 'Forecasted precipitation', weight: 0.35 },
      ],
    };

    expect(response.riskProbability).toBe(0.82);
    expect(response.riskLevel).toBe('HIGH');
    expect(response.trend).toBe('INCREASING');
    expect(response.contributingFactors).toHaveLength(2);
  });
});
