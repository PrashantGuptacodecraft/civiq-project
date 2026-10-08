# CivIQ Database Package

This package owns the Prisma schema, generated client, migrations, and seed framework.

## Setup

```bash
# 1. Copy .env.example and set DATABASE_URL
cp .env.example .env

# 2. Generate the Prisma client
pnpm db:generate

# 3. Apply migrations (creates the database if it doesn't exist)
pnpm db:migrate

# 4. Seed development data
pnpm db:seed
```

## Conventions

| Convention | Rule |
|---|---|
| Primary keys | `cuid()` — lexicographically sortable, URL-safe |
| Timestamps | `createdAt @default(now())` + `updatedAt @updatedAt` on every model |
| Soft delete | `deletedAt DateTime?` — query filters must exclude `deletedAt != null` |
| Optimistic lock | `version Int @default(0)` on mutable aggregates; increment on update |
| Sensitive data | Never store raw Aadhaar, PAN, or passwords in plain text |
| Indexes | Add `@@index` for every FK and common filter field |

## Scripts

| Script | Description |
|---|---|
| `pnpm db:generate` | Generate Prisma client from schema |
| `pnpm db:migrate` | Apply pending migrations (dev) |
| `pnpm db:migrate:prod` | Apply migrations in production (no prompt) |
| `pnpm db:reset` | Reset DB and re-apply all migrations (dev only) |
| `pnpm db:seed` | Run seed script |
| `pnpm db:studio` | Open Prisma Studio |
