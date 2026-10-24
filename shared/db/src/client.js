import { PrismaClient } from './generated';

/**
 * Singleton PrismaClient for use across the monorepo.
 * Import this instead of instantiating PrismaClient directly.
 */
const globalForPrisma = globalThis  as { prisma?};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export { PrismaClient } from './generated';
export * from './generated';