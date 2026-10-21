import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  RoutingMatrix,
  routingMatrix,
  DEFAULT_LOW_RISK_AUTO_ROUTE_CONFIGS,
} from './routing.matrix';
import { RoutingPolicyEngine, routingPolicyEngine } from './routing.policy';
import { RoutingService, routingService } from './routing.service';
import { RoutingCandidateDepartment } from './routing.types';
import { prisma } from '@civiq/db';

vi.mock('@civiq/db', () => ({
  prisma: {
    issue: {
      findUnique: vi.fn(),
    },
    department: {
      findMany: vi.fn(),
    },
    aiAuditRecord: {
      create: vi.fn(),
    },
  },
}));

describe('Smart Department Routing', () => {
  const jurisdictionNorth = 'jur-delhi-north';
  const jurisdictionSouth = 'jur-delhi-south';

  const sampleDepartments: RoutingCandidateDepartment[] = [
    {
      id: 'dept-pwd-north',
      name: 'Public Works Department (PWD) North',
      organizationId: 'org-mcd-north',
      jurisdictionId: jurisdictionNorth,
      issueCategories: ['roads_pothole', 'roads_footpath_damage'],
    },
    {
      id: 'dept-elec-north',
      name: 'North Delhi Power Limited',
      organizationId: 'org-power-north',
      jurisdictionId: jurisdictionNorth,
      issueCategories: ['electrical_hanging_wires', 'roads_streetlighting'],
    },
    {
      id: 'dept-water-north',
      name: 'Delhi Jal Board North',
      organizationId: 'org-djb-north',
      jurisdictionId: jurisdictionNorth,
      issueCategories: ['water_pipeline_leak', 'water_no_supply'],
    },
    {
      id: 'dept-sanitation-north',
      name: 'MCD Solid Waste Management North',
      organizationId: 'org-mcd-north',
      jurisdictionId: jurisdictionNorth,
      issueCategories: ['waste_garbage_dump', 'waste_dead_animal'],
    },
    {
      id: 'dept-pwd-south',
      name: 'Public Works Department (PWD) South',
      organizationId: 'org-mcd-south',
      jurisdictionId: jurisdictionSouth,
      issueCategories: ['roads_pothole', 'roads_footpath_damage'],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Routing Matrix (Taxonomy + Jurisdiction Mapping)', () => {
    it('correctly retrieves default department from taxonomy for all standard categories', () => {
      expect(routingMatrix.getDefaultDepartmentForCategory('roads_pothole')).toContain(
        'Public Works Department'
      );
      expect(routingMatrix.getDefaultDepartmentForCategory('roads_streetlighting')).toBe(
        'Electrical Department'
      );
      expect(routingMatrix.getDefaultDepartmentForCategory('sanitation_blocked_drain')).toBe(
        'Sewerage & Drainage Department'
      );
      expect(routingMatrix.getDefaultDepartmentForCategory('water_pipeline_leak')).toBe(
        'Water Supply Department'
      );
      expect(routingMatrix.getDefaultDepartmentForCategory('waste_garbage_dump')).toBe(
        'Solid Waste Management'
      );
      expect(routingMatrix.getDefaultDepartmentForCategory('electrical_hanging_wires')).toBe(
        'Electrical Department'
      );
    });

    it('filters candidate departments strictly matching jurisdiction and category capability', () => {
      const allowed = routingMatrix.filterAllowedDepartments({
        categoryId: 'roads_pothole',
        jurisdictionId: jurisdictionNorth,
        departments: sampleDepartments,
      });

      expect(allowed.length).toBe(1);
      expect(allowed[0]?.id).toBe('dept-pwd-north');
      expect(allowed[0]?.jurisdictionId).toBe(jurisdictionNorth);
      expect(allowed[0]?.issueCategories).toContain('roads_pothole');
    });

    it('excludes departments belonging to foreign jurisdictions', () => {
      const allowed = routingMatrix.filterAllowedDepartments({
        categoryId: 'roads_pothole',
        jurisdictionId: jurisdictionSouth,
        departments: sampleDepartments,
      });

      expect(allowed.length).toBe(1);
      expect(allowed[0]?.id).toBe('dept-pwd-south');
      expect(allowed[0]?.jurisdictionId).toBe(jurisdictionSouth);
    });

    it('excludes departments in the same jurisdiction lacking category capability', () => {
      const allowed = routingMatrix.filterAllowedDepartments({
        categoryId: 'water_pipeline_leak',
        jurisdictionId: jurisdictionNorth,
        departments: sampleDepartments,
      });

      expect(allowed.length).toBe(1);
      expect(allowed[0]?.id).toBe('dept-water-north');
      expect(allowed.some((d) => d.id === 'dept-elec-north')).toBe(false);
      expect(allowed.some((d) => d.id === 'dept-pwd-north')).toBe(false);
    });
  });

  describe('Verification Gate Policy', () => {
    it('passes verification gate unconditionally when issue is VERIFIED', () => {
      const gateResult = routingPolicyEngine.evaluateVerificationGate({
        verificationStatus: 'VERIFIED',
        categoryId: 'electrical_hanging_wires',
        severity: 'CRITICAL',
      });

      expect(gateResult.passed).toBe(true);
      expect(gateResult.isLowRiskBypass).toBe(false);
      expect(gateResult.reason).toContain('VERIFIED');
    });

    it('holds unverified issues for high-consequence hazard categories', () => {
      const gateResult = routingPolicyEngine.evaluateVerificationGate({
        verificationStatus: 'PENDING',
        categoryId: 'electrical_hanging_wires',
        severity: 'CRITICAL',
      });

      expect(gateResult.passed).toBe(false);
      expect(gateResult.isLowRiskBypass).toBe(false);
      expect(gateResult.reason).toContain('Routing held');
    });

    it('holds unverified issues when severity is CRITICAL or HIGH even if category is low-risk', () => {
      const gateResult = routingPolicyEngine.evaluateVerificationGate({
        verificationStatus: 'PENDING',
        categoryId: 'roads_footpath_damage',
        severity: 'CRITICAL',
      });

      expect(gateResult.passed).toBe(false);
      expect(gateResult.isLowRiskBypass).toBe(false);
      expect(gateResult.reason).toContain('Routing held');
    });

    it('allows configured low-risk categories with LOW/MEDIUM severity to bypass verification', () => {
      const gateResult = routingPolicyEngine.evaluateVerificationGate({
        verificationStatus: 'PENDING',
        categoryId: 'roads_footpath_damage',
        severity: 'LOW',
      });

      expect(gateResult.passed).toBe(true);
      expect(gateResult.isLowRiskBypass).toBe(true);
      expect(gateResult.reason).toContain('low-risk auto-route bypass');
    });

    it('allows routine garbage accumulation with MEDIUM severity to bypass verification', () => {
      const gateResult = routingPolicyEngine.evaluateVerificationGate({
        verificationStatus: 'IN_REVIEW',
        categoryId: 'waste_garbage_dump',
        severity: 'MEDIUM',
      });

      expect(gateResult.passed).toBe(true);
      expect(gateResult.isLowRiskBypass).toBe(true);
    });
  });

  describe('Routing Execution & Policy Constraint Enforcement', () => {
    it('routes a verified issue to the matching department when no AI recommendation is provided', () => {
      const decision = routingService.evaluateRouting({
        issueId: 'iss-101',
        title: 'Deep pothole on Main Ring Road',
        description: 'Pothole damaging vehicle tires',
        categoryId: 'roads_pothole',
        jurisdictionId: jurisdictionNorth,
        verificationStatus: 'VERIFIED',
        severity: 'MEDIUM',
        availableDepartments: sampleDepartments,
      });

      expect(decision.status).toBe('ROUTED');
      expect(decision.assignedDepartmentId).toBe('dept-pwd-north');
      expect(decision.assignedDepartmentName).toContain('Public Works Department (PWD) North');
      expect(decision.verificationPassed).toBe(true);
      expect(decision.isLowRiskBypass).toBe(false);
      expect(decision.aiRecommendationAccepted).toBe(false);
      expect(decision.policyViolations).toHaveLength(0);
    });

    it('fast-tracks unverified low-risk issue via low-risk bypass', () => {
      const decision = routingService.evaluateRouting({
        issueId: 'iss-102',
        title: 'Cracked paver block on sidewalk',
        description: 'Loose sidewalk tile',
        categoryId: 'roads_footpath_damage',
        jurisdictionId: jurisdictionNorth,
        verificationStatus: 'PENDING',
        severity: 'LOW',
        availableDepartments: sampleDepartments,
      });

      expect(decision.status).toBe('ROUTED_LOW_RISK_BYPASS');
      expect(decision.assignedDepartmentId).toBe('dept-pwd-north');
      expect(decision.verificationPassed).toBe(true);
      expect(decision.isLowRiskBypass).toBe(true);
    });

    it('holds unverified high-consequence issue at the verification gate', () => {
      const decision = routingService.evaluateRouting({
        issueId: 'iss-103',
        title: 'Live power wire snapped and sparking on street',
        description: 'Exposed 440V line on pavement',
        categoryId: 'electrical_hanging_wires',
        jurisdictionId: jurisdictionNorth,
        verificationStatus: 'PENDING',
        severity: 'CRITICAL',
        availableDepartments: sampleDepartments,
      });

      expect(decision.status).toBe('ROUTING_HELD_PENDING_VERIFICATION');
      expect(decision.assignedDepartmentId).toBeUndefined();
      expect(decision.verificationPassed).toBe(false);
      expect(decision.isLowRiskBypass).toBe(false);
      expect(decision.verificationReason).toContain('Routing held');
    });

    it('accepts valid AI recommendation when it adheres to jurisdiction and capability rules', () => {
      const decision = routingService.evaluateRouting({
        issueId: 'iss-104',
        title: 'Major water pipeline burst flooding sector road',
        description: 'Clean drinking water gushing from underground pipe',
        categoryId: 'water_pipeline_leak',
        jurisdictionId: jurisdictionNorth,
        verificationStatus: 'VERIFIED',
        severity: 'HIGH',
        availableDepartments: sampleDepartments,
        aiRecommendation: {
          departmentId: 'dept-water-north',
          departmentName: 'Delhi Jal Board North',
          confidence: 0.96,
          reasoning: 'Primary municipal water utility for North Delhi',
        },
      });

      expect(decision.status).toBe('ROUTED');
      expect(decision.assignedDepartmentId).toBe('dept-water-north');
      expect(decision.aiRecommendationAccepted).toBe(true);
      expect(decision.policyViolations).toHaveLength(0);
      expect(decision.policyOverrideReason).toBeUndefined();
    });

    it('overrides AI recommendation that violates jurisdiction constraint (foreign jurisdiction)', () => {
      const decision = routingService.evaluateRouting({
        issueId: 'iss-105',
        title: 'Pothole near North Campus gate',
        description: 'Road damage on North Delhi campus road',
        categoryId: 'roads_pothole',
        jurisdictionId: jurisdictionNorth,
        verificationStatus: 'VERIFIED',
        severity: 'MEDIUM',
        availableDepartments: sampleDepartments,
        // AI errantly recommends the South Delhi PWD department!
        aiRecommendation: {
          departmentId: 'dept-pwd-south',
          departmentName: 'Public Works Department (PWD) South',
          confidence: 0.88,
          reasoning: 'Matches PWD responsibility',
        },
      });

      expect(decision.status).toBe('ROUTING_OVERRIDDEN_BY_POLICY');
      expect(decision.assignedDepartmentId).toBe('dept-pwd-north'); // Overridden to local north PWD
      expect(decision.aiRecommendationAccepted).toBe(false);
      expect(decision.policyViolations.length).toBeGreaterThan(0);
      expect(decision.policyViolations[0]).toContain('JURISDICTION_MISMATCH');
      expect(decision.policyOverrideReason).toContain('Policy constraint violation');
      expect(decision.decisionEvidence.policyOverrideReason).toBeDefined();
    });

    it('overrides AI recommendation that violates category capability constraint', () => {
      const decision = routingService.evaluateRouting({
        issueId: 'iss-106',
        title: 'Road pothole in North Delhi',
        description: 'Crater in asphalt road',
        categoryId: 'roads_pothole',
        jurisdictionId: jurisdictionNorth,
        verificationStatus: 'VERIFIED',
        severity: 'MEDIUM',
        availableDepartments: sampleDepartments,
        // AI errantly recommends the Water Board for a pothole!
        aiRecommendation: {
          departmentId: 'dept-water-north',
          departmentName: 'Delhi Jal Board North',
          confidence: 0.70,
          reasoning: 'Errant AI classification',
        },
      });

      expect(decision.status).toBe('ROUTING_OVERRIDDEN_BY_POLICY');
      expect(decision.assignedDepartmentId).toBe('dept-pwd-north'); // Overridden to capable department
      expect(decision.aiRecommendationAccepted).toBe(false);
      expect(decision.policyViolations.some((v) => v.includes('CAPABILITY_MISMATCH'))).toBe(true);
    });

    it('returns ROUTING_FAILED_NO_DEPARTMENT when no department has capability in jurisdiction', () => {
      const decision = routingService.evaluateRouting({
        issueId: 'iss-107',
        title: 'Unusable public toilet in South Delhi',
        description: 'Sanitation facility broken',
        categoryId: 'facilities_public_toilet',
        jurisdictionId: jurisdictionSouth,
        verificationStatus: 'VERIFIED',
        severity: 'MEDIUM',
        availableDepartments: sampleDepartments, // Only has PWD South in South Delhi
      });

      expect(decision.status).toBe('ROUTING_FAILED_NO_DEPARTMENT');
      expect(decision.assignedDepartmentId).toBeUndefined();
      expect(decision.candidateDepartments).toHaveLength(0);
    });
  });

  describe('Database Integration (routeIssueById)', () => {
    it('fetches issue and candidate departments from database and executes routing with AI audit record', async () => {
      const mockIssue = {
        id: 'iss-db-1',
        title: 'Garbage dump near public park',
        description: 'Household waste rotting on pavement',
        categoryId: 'waste_garbage_dump',
        jurisdictionId: jurisdictionNorth,
        verificationStatus: 'VERIFIED',
        severity: 'MEDIUM',
      };

      const mockDbDepartments = [
        {
          id: 'dept-sanitation-north',
          name: 'MCD Solid Waste Management North',
          organizationId: 'org-mcd-north',
          issueCategories: ['waste_garbage_dump'],
          organization: {
            id: 'org-mcd-north',
            name: 'MCD North',
            jurisdictionId: jurisdictionNorth,
          },
        },
      ];

      vi.mocked(prisma.issue.findUnique).mockResolvedValue(mockIssue as any);
      vi.mocked(prisma.department.findMany).mockResolvedValue(mockDbDepartments as any);
      vi.mocked(prisma.aiAuditRecord.create).mockResolvedValue({ id: 'rec-1' } as any);

      const decision = await routingService.routeIssueById('iss-db-1', {
        aiRecommendation: {
          departmentId: 'dept-sanitation-north',
          departmentName: 'MCD Solid Waste Management North',
          confidence: 0.92,
        },
      });

      expect(decision).not.toBeNull();
      expect(decision?.status).toBe('ROUTED');
      expect(decision?.assignedDepartmentId).toBe('dept-sanitation-north');
      expect(decision?.aiRecommendationAccepted).toBe(true);
      expect(prisma.aiAuditRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            operation: 'DEPARTMENT_ROUTING',
            issueId: 'iss-db-1',
            humanDecision: 'ACCEPTED',
          }),
        })
      );
    });

    it('returns null if issue is not found in database', async () => {
      vi.mocked(prisma.issue.findUnique).mockResolvedValue(null);

      const decision = await routingService.routeIssueById('non-existent-issue');
      expect(decision).toBeNull();
    });
  });
});
