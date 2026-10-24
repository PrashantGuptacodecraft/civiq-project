import { PrismaClient } from './generated/index.js';
/**
 * Singleton PrismaClient for use across the monorepo.
 * Import this instead of instantiating PrismaClient directly.
 */
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'warn', 'error']
            : ['warn', 'error'],
    });
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
export { PrismaClient } from './generated/index.js';
export * from './generated/index.js';
