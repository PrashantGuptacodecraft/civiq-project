import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OfficialOnboardingService } from './onboarding.service';
import { prisma } from '@civiq/db';

vi.mock('@civiq/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    officialInvite: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    roleAssignment: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

describe('OfficialOnboardingService', () => {
  const service = new OfficialOnboardingService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create an invite successfully', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'admin1', role: 'DISTRICT_ULB_ADMIN' } as any);
    vi.mocked(prisma.officialInvite.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.officialInvite.create).mockResolvedValue({ id: 'inv1' } as any);

    const result = await service.inviteOfficial({
      email: 'worker@gov.in',
      role: 'FIELD_WORKER',
      organizationId: 'org1',
      invitedById: 'admin1',
    });

    expect(result.success).toBe(true);
    expect(result.inviteId).toBe('inv1');
    expect(result.rawToken).toBeDefined();

    expect(prisma.officialInvite.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'worker@gov.in',
          role: 'FIELD_WORKER',
          organizationId: 'org1',
          invitedById: 'admin1',
          tokenHash: expect.any(String),
        }),
      })
    );
  });

  it('should block non-admins from inviting', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'citizen1', role: 'CITIZEN' } as any);

    const result = await service.inviteOfficial({
      email: 'worker@gov.in',
      role: 'FIELD_WORKER',
      organizationId: 'org1',
      invitedById: 'citizen1',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
    expect(prisma.officialInvite.create).not.toHaveBeenCalled();
  });

  it('should prevent replay/duplicate invites to the same person', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'admin1', role: 'DISTRICT_ULB_ADMIN' } as any);
    vi.mocked(prisma.officialInvite.findFirst).mockResolvedValue({
      id: 'inv2',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 100000)
    } as any);

    const result = await service.inviteOfficial({
      email: 'worker@gov.in',
      role: 'FIELD_WORKER',
      organizationId: 'org1',
      invitedById: 'admin1',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });

  it('should accept an invite, create role assignment, and upgrade user role', async () => {
    vi.mocked(prisma.officialInvite.findUnique).mockResolvedValue({
      id: 'inv3',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 100000),
      role: 'FIELD_WORKER',
      organizationId: 'org1',
      departmentId: null
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user1', role: 'CITIZEN' } as any);
    vi.mocked(prisma.roleAssignment.findFirst).mockResolvedValue(null);

    const result = await service.acceptInvite('user1', 'raw_token_abc');

    expect(result.success).toBe(true);
    
    // Check invite updated
    expect(prisma.officialInvite.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'inv3' },
        data: expect.objectContaining({ status: 'ACCEPTED', acceptedById: 'user1' }),
      })
    );

    // Check role assignment created
    expect(prisma.roleAssignment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user1', role: 'FIELD_WORKER', organizationId: 'org1' })
      })
    );

    // Check user role upgraded
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user1' },
        data: { role: 'FIELD_WORKER' }
      })
    );
  });

  it('should reject expired invites', async () => {
    vi.mocked(prisma.officialInvite.findUnique).mockResolvedValue({
      id: 'inv4',
      status: 'PENDING',
      expiresAt: new Date(Date.now() - 100000), // Expired
    } as any);

    const result = await service.acceptInvite('user1', 'raw_token');

    expect(result.success).toBe(false);
    expect(result.error).toContain('expired');
    
    // Validates that it automatically marks it expired
    expect(prisma.officialInvite.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'inv4' },
        data: { status: 'EXPIRED' }
      })
    );
  });
});
