import { prisma, Prisma, IntegrationType, IntegrationSource, ExternalReference } from '@civiq/shared-db';
import { SyncResult, IntegrationAdapter } from '@civiq/shared-contracts';

export class IntegrationService {
  /**
   * Register a new integration source or return the existing one.
   */
  async registerSource(name, type, confidence = 50) {
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
  async executeSync(integrationId, adapter) {
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
    } catch (error) {
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
    integrationId,
    objectType,
    objectId,
    externalId,
    metadata?, any>
  ) {
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