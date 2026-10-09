import { prisma, Prisma, IntegrationType, IntegrationSource, ExternalReference } from '@civiq/db';
import { SyncResult, IntegrationAdapter } from '@civiq/contracts';

export class IntegrationService {
  /**
   * Register a new integration source or return the existing one.
   */
  async registerSource(name: string, type: IntegrationType, confidence: number = 50): Promise<IntegrationSource> {
    const existing = await prisma.integrationSource.findFirst({
      where: { name, type }
    });

    if (existing) {
      return prisma.integrationSource.update({
        where: { id: existing.id },
        data: { confidence }
      });
    }

    return prisma.integrationSource.create({
      data: { name, type, confidence }
    });
  }

  /**
   * Runs the provided adapter, handling cursors and recording sync outcomes.
   */
  async executeSync(integrationId: string, adapter: IntegrationAdapter): Promise<SyncResult> {
    const source = await prisma.integrationSource.findUniqueOrThrow({
      where: { id: integrationId }
    });

    try {
      const result = await adapter.sync(source.syncCursor);
      
      await prisma.integrationSource.update({
        where: { id: integrationId },
        data: {
          lastSyncAt: new Date(),
          ...(result.success ? { lastSuccessAt: new Date() } : {}),
          ...(result.newCursor ? { syncCursor: result.newCursor } : {}),
          errorState: result.success ? Prisma.DbNull : (result.errorDetails || Prisma.DbNull)
        }
      });

      return result;
    } catch (error: any) {
      // Record failure state
      await prisma.integrationSource.update({
        where: { id: integrationId },
        data: {
          lastSyncAt: new Date(),
          errorState: { message: error.message, stack: error.stack }
        }
      });

      return {
        success: false,
        recordsProcessed: 0,
        errorDetails: { message: error.message }
      };
    }
  }

  /**
   * Create a provenance link (ExternalReference) between a local record and external system.
   */
  async linkExternalRecord(
    integrationId: string,
    objectType: string,
    objectId: string,
    externalId: string,
    metadata?: Record<string, any>
  ): Promise<ExternalReference> {
    return prisma.externalReference.upsert({
      where: {
        integrationId_objectType_externalId: {
          integrationId,
          objectType,
          externalId
        }
      },
      update: { metadata: metadata ?? {} },
      create: {
        integrationId,
        objectType,
        objectId,
        externalId,
        metadata: metadata ?? {}
      }
    });
  }
}

export const integrationService = new IntegrationService();
