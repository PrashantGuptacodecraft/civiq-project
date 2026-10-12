import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IssueService, getTaxonomyCategory } from './issue.service';
import { prisma } from '@civiq/db';

vi.mock('@civiq/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    jurisdiction: {
      findUnique: vi.fn(),
    },
    issue: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    verificationHistory: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
  IssueStatus: {
    SUBMITTED: 'SUBMITTED',
  },
  VerificationStatus: {
    PENDING: 'PENDING',
  },
  IssueSeverity: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
  },
}));

describe('IssueService - Civic Issue Creation and Validation', () => {
  const service = new IssueService();

  const mockUser = {
    id: 'user-citizen-1',
    email: 'citizen@civiq.dev',
    role: 'CITIZEN',
    status: 'ACTIVE',
  };

  const mockJurisdiction = {
    id: 'mh-pune',
    name: 'Pune',
    type: 'DISTRICT',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Taxonomy Helper', () => {
    it('finds registered taxonomy category correctly', () => {
      const category = getTaxonomyCategory('roads_pothole');
      expect(category).not.toBeNull();
      expect(category?.name).toBe('Pothole');
      expect(category?.severity).toBe('MEDIUM');
    });

    it('returns null for unregistered taxonomy category', () => {
      expect(getTaxonomyCategory('invalid_category_xyz')).toBeNull();
    });
  });

  describe('Validation Checks', () => {
    it('rejects submission without authenticated userId', async () => {
      await expect(
        service.createIssue({
          userId: '',
          data: {
            description: 'Pothole on main road causing accidents',
            categoryId: 'roads_pothole',
            jurisdictionId: 'mh-pune',
          },
        })
      ).rejects.toThrow('Authentication required');
    });

    it('rejects if user does not exist', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        service.createIssue({
          userId: 'non-existent-user',
          data: {
            description: 'Pothole on main road causing accidents',
            categoryId: 'roads_pothole',
            jurisdictionId: 'mh-pune',
          },
        })
      ).rejects.toThrow('User not found');
    });

    it('rejects if user account is suspended or inactive', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        status: 'SUSPENDED',
      } as any);

      await expect(
        service.createIssue({
          userId: mockUser.id,
          data: {
            description: 'Pothole on main road causing accidents',
            categoryId: 'roads_pothole',
            jurisdictionId: 'mh-pune',
          },
        })
      ).rejects.toThrow('inactive or suspended');
    });

    it('rejects description less than 10 characters', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      await expect(
        service.createIssue({
          userId: mockUser.id,
          data: {
            description: 'Short',
            categoryId: 'roads_pothole',
            jurisdictionId: 'mh-pune',
          },
        })
      ).rejects.toThrow('Description must be at least 10 characters');
    });

    it('rejects missing category', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      await expect(
        service.createIssue({
          userId: mockUser.id,
          data: {
            description: 'A deep pothole on MG Road near the signal',
            categoryId: '',
            jurisdictionId: 'mh-pune',
          },
        })
      ).rejects.toThrow('Category is required');
    });

    it('rejects invalid category not in civic taxonomy', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      await expect(
        service.createIssue({
          userId: mockUser.id,
          data: {
            description: 'A deep pothole on MG Road near the signal',
            categoryId: 'alien_invasion',
            jurisdictionId: 'mh-pune',
          },
        })
      ).rejects.toThrow('Invalid category: "alien_invasion"');
    });

    it('rejects missing jurisdiction', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      await expect(
        service.createIssue({
          userId: mockUser.id,
          data: {
            description: 'A deep pothole on MG Road near the signal',
            categoryId: 'roads_pothole',
            jurisdictionId: '',
          },
        })
      ).rejects.toThrow('Jurisdiction is required');
    });

    it('rejects non-existent jurisdiction in database', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.jurisdiction.findUnique).mockResolvedValue(null);

      await expect(
        service.createIssue({
          userId: mockUser.id,
          data: {
            description: 'A deep pothole on MG Road near the signal',
            categoryId: 'roads_pothole',
            jurisdictionId: 'unknown-jur',
          },
        })
      ).rejects.toThrow('Jurisdiction not found: "unknown-jur"');
    });

    it('rejects invalid latitude out of range [-90, 90]', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.jurisdiction.findUnique).mockResolvedValue(mockJurisdiction as any);

      await expect(
        service.createIssue({
          userId: mockUser.id,
          data: {
            description: 'A deep pothole on MG Road near the signal',
            categoryId: 'roads_pothole',
            jurisdictionId: 'mh-pune',
            latitude: 120.5,
            longitude: 73.85,
          },
        })
      ).rejects.toThrow('Latitude must be between -90 and 90');
    });

    it('rejects invalid longitude out of range [-180, 180]', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.jurisdiction.findUnique).mockResolvedValue(mockJurisdiction as any);

      await expect(
        service.createIssue({
          userId: mockUser.id,
          data: {
            description: 'A deep pothole on MG Road near the signal',
            categoryId: 'roads_pothole',
            jurisdictionId: 'mh-pune',
            latitude: 18.52,
            longitude: -200,
          },
        })
      ).rejects.toThrow('Longitude must be between -180 and 180');
    });
  });

  describe('Successful Creation', () => {
    it('creates issue with description, category, jurisdiction, location and source', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.jurisdiction.findUnique).mockResolvedValue(mockJurisdiction as any);

      const createdMockIssue = {
        id: 'issue-cuid-12345',
        title: 'Pothole on MG Road',
        description: 'Large pothole in front of supermarket causing traffic jams',
        categoryId: 'roads_pothole',
        jurisdictionId: 'mh-pune',
        latitude: 18.5204,
        longitude: 73.8567,
        address: 'MG Road, Pune',
        state: 'Maharashtra',
        district: 'Pune',
        city: 'Pune',
        source: 'MOBILE_APP',
        severity: 'MEDIUM',
        status: 'SUBMITTED',
        verificationStatus: 'PENDING',
        reportedById: mockUser.id,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.issue.create).mockResolvedValue(createdMockIssue as any);
      vi.mocked(prisma.verificationHistory.create).mockResolvedValue({ id: 'vh-1' } as any);

      const result = await service.createIssue({
        userId: mockUser.id,
        data: {
          title: 'Pothole on MG Road',
          description: 'Large pothole in front of supermarket causing traffic jams',
          categoryId: 'roads_pothole',
          jurisdictionId: 'mh-pune',
          latitude: 18.5204,
          longitude: 73.8567,
          address: 'MG Road, Pune',
          state: 'Maharashtra',
          district: 'Pune',
          city: 'Pune',
          source: 'MOBILE_APP',
        },
      });

      expect(result.id).toBe('issue-cuid-12345');
      expect(result.status).toBe('SUBMITTED');
      expect(result.verificationStatus).toBe('PENDING');
      expect(result.categoryId).toBe('roads_pothole');
      expect(result.jurisdictionId).toBe('mh-pune');
      expect(result.source).toBe('MOBILE_APP');

      // Verify DB calls
      expect(prisma.issue.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Pothole on MG Road',
          description: 'Large pothole in front of supermarket causing traffic jams',
          categoryId: 'roads_pothole',
          jurisdictionId: 'mh-pune',
          source: 'MOBILE_APP',
          severity: 'MEDIUM',
          status: 'SUBMITTED',
          verificationStatus: 'PENDING',
          reportedById: mockUser.id,
        }),
      });

      // Verify audit verification history
      expect(prisma.verificationHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          issueId: 'issue-cuid-12345',
          previousStatus: 'PENDING',
          newStatus: 'PENDING',
          changedById: mockUser.id,
        }),
      });
    });

    it('derives severity from taxonomy category and defaults source to CITIZEN_WEB', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.jurisdiction.findUnique).mockResolvedValue(mockJurisdiction as any);

      const createdMockIssue = {
        id: 'issue-cuid-67890',
        title: 'Open or Broken Manhole - Main sewer manhole cover is missing...',
        description: 'Main sewer manhole cover is missing near the school bus stop',
        categoryId: 'sanitation_open_manhole',
        jurisdictionId: 'mh-pune',
        source: 'CITIZEN_WEB',
        severity: 'CRITICAL',
        status: 'SUBMITTED',
        verificationStatus: 'PENDING',
        reportedById: mockUser.id,
      };

      vi.mocked(prisma.issue.create).mockResolvedValue(createdMockIssue as any);
      vi.mocked(prisma.verificationHistory.create).mockResolvedValue({ id: 'vh-2' } as any);

      const result = await service.createIssue({
        userId: mockUser.id,
        data: {
          description: 'Main sewer manhole cover is missing near the school bus stop',
          categoryId: 'sanitation_open_manhole',
          jurisdictionId: 'mh-pune',
        },
      });

      expect(prisma.issue.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          categoryId: 'sanitation_open_manhole',
          severity: 'CRITICAL',
          source: 'CITIZEN_WEB',
        }),
      });

      expect(result.severity).toBe('CRITICAL');
      expect(result.source).toBe('CITIZEN_WEB');
    });
  });

  describe('Issue Retrieval', () => {
    it('fetches an issue by ID with relations', async () => {
      const mockIssue = {
        id: 'iss-1',
        title: 'Broken pipe',
        reportedBy: { id: 'u-1', email: 'c@c.dev' },
      };
      vi.mocked(prisma.issue.findUnique).mockResolvedValue(mockIssue as any);

      const issue = await service.getIssueById('iss-1');
      expect(issue).toEqual(mockIssue);
      expect(prisma.issue.findUnique).toHaveBeenCalledWith({
        where: { id: 'iss-1' },
        include: expect.any(Object),
      });
    });

    it('lists issues with filters', async () => {
      vi.mocked(prisma.issue.findMany).mockResolvedValue([{ id: 'iss-1' }] as any);

      const issues = await service.listIssues({
        userId: 'u-1',
        jurisdictionId: 'mh-pune',
      });

      expect(issues).toHaveLength(1);
      expect(prisma.issue.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          reportedById: 'u-1',
          jurisdictionId: 'mh-pune',
        }),
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
