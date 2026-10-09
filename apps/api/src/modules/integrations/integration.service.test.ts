import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntegrationService } from './integration.service';
import { prisma } from '@civiq/db';
import { IntegrationAdapter, SyncResult } from '@civiq/contracts';

vi.mock('@civiq/db', () => ({
  prisma: {
    integrationSource: {
      findFirst: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    externalReference: {
      upsert: vi.fn(),
    },
  },
  IntegrationType: {
    GOVERNMENT_API: 'GOVERNMENT_API',
    SENSOR_NETWORK: 'SENSOR_NETWORK'
  },
  Prisma: {
    DbNull: 'DbNull'
  }
}));

// Dummy adapter for testing
class MockAdapter implements IntegrationAdapter {
  providerName = 'test-provider';
  async sync(cursor?: string | null): Promise<SyncResult> {
    return { success: true, recordsProcessed: 10, newCursor: 'cursor-10' };
  }
  async verify(externalId: string): Promise<boolean> {
    return true;
  }
}

describe('IntegrationService', () => {
  const service = new IntegrationService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register a new integration source', async () => {
    vi.mocked(prisma.integrationSource.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.integrationSource.create).mockResolvedValue({ id: 'src-1' } as any);

    const source = await service.registerSource('LGD', 'GOVERNMENT_API' as any, 90);
    
    expect(prisma.integrationSource.create).toHaveBeenCalledWith({
      data: { name: 'LGD', type: 'GOVERNMENT_API', confidence: 90 }
    });
    expect(source.id).toBe('src-1');
  });

  it('should execute sync and update cursor successfully', async () => {
    const mockSource = { id: 'src-1', syncCursor: 'cursor-0' };
    vi.mocked(prisma.integrationSource.findUniqueOrThrow).mockResolvedValue(mockSource as any);
    vi.mocked(prisma.integrationSource.update).mockResolvedValue({} as any);

    const adapter = new MockAdapter();
    const result = await service.executeSync('src-1', adapter);

    expect(result.success).toBe(true);
    expect(prisma.integrationSource.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'src-1' },
        data: expect.objectContaining({
          syncCursor: 'cursor-10',
          errorState: 'DbNull'
        })
      })
    );
  });

  it('should record failure state when adapter throws', async () => {
    const mockSource = { id: 'src-2' };
    vi.mocked(prisma.integrationSource.findUniqueOrThrow).mockResolvedValue(mockSource as any);

    const failingAdapter: IntegrationAdapter = {
      providerName: 'fail-provider',
      sync: async () => { throw new Error('API Timeout'); },
      verify: async () => false,
    };

    const result = await service.executeSync('src-2', failingAdapter);

    expect(result.success).toBe(false);
    expect(result.errorDetails?.message).toBe('API Timeout');
    expect(prisma.integrationSource.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          errorState: expect.objectContaining({ message: 'API Timeout' })
        })
      })
    );
  });

  it('should create an external reference (provenance)', async () => {
    vi.mocked(prisma.externalReference.upsert).mockResolvedValue({ id: 'ext-1' } as any);

    await service.linkExternalRecord('src-1', 'Issue', 'local-issue-1', 'ext-issue-99', { agency: 'PMC' });

    expect(prisma.externalReference.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          integrationId_objectType_externalId: {
            integrationId: 'src-1',
            objectType: 'Issue',
            externalId: 'ext-issue-99'
          }
        },
        create: expect.objectContaining({
          objectId: 'local-issue-1',
          metadata: { agency: 'PMC' }
        })
      })
    );
  });
});
