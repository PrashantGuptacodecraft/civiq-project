import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrganizationService } from './organization.service';
import { prisma, OrganizationType, OrgVerificationStatus } from '@civiq/db';

vi.mock('@civiq/db', () => ({
  prisma: {
    organization: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
  OrganizationType: {
    NGO: 'NGO',
    GOVERNMENT: 'GOVERNMENT',
  },
  OrgVerificationStatus: {
    PENDING: 'PENDING',
    VERIFIED: 'VERIFIED',
  },
}));

describe('OrganizationService', () => {
  const service = new OrganizationService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create an organization', async () => {
    const mockOrg = { id: 'org-1', name: 'Test NGO', type: 'NGO', jurisdictionId: 'jur-1' };
    vi.mocked(prisma.organization.create).mockResolvedValue(mockOrg as any);

    const result = await service.createOrganization({
      name: 'Test NGO',
      type: 'NGO' as OrganizationType,
      jurisdictionId: 'jur-1',
    });

    expect(prisma.organization.create).toHaveBeenCalledWith({
      data: { name: 'Test NGO', type: 'NGO', jurisdictionId: 'jur-1' },
    });
    expect(result).toEqual(mockOrg);
  });

  it('should list organizations by jurisdiction scope', async () => {
    const mockOrgs = [{ id: 'org-1', name: 'Test NGO', jurisdictionId: 'jur-1' }];
    vi.mocked(prisma.organization.findMany).mockResolvedValue(mockOrgs as any);

    const result = await service.listOrganizationsByJurisdiction('jur-1');

    expect(prisma.organization.findMany).toHaveBeenCalledWith({
      where: { jurisdictionId: 'jur-1', deletedAt: null },
      include: { jurisdiction: true },
    });
    expect(result).toEqual(mockOrgs);
  });
});
