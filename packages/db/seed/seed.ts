import { PrismaClient, Role } from '../src/generated';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱  Seeding database...');

  // ── Platform super admin ──────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@civiq.dev' },
    update: {},
    create: {
      email: 'admin@civiq.dev',
      role: Role.PLATFORM_SUPER_ADMIN,
      profile: {
        create: {
          displayName: 'CivIQ Admin',
          state: 'Delhi',
          city: 'New Delhi',
        },
      },
    },
  });
  console.log(`  ✓ Admin user: ${admin.email}`);

  // ── Sample citizen ────────────────────────────────────────────────────────
  const citizen = await prisma.user.upsert({
    where: { email: 'citizen@civiq.dev' },
    update: {},
    create: {
      email: 'citizen@civiq.dev',
      role: Role.CITIZEN,
      profile: {
        create: {
          displayName: 'Test Citizen',
          state: 'Maharashtra',
          district: 'Pune',
          city: 'Pune',
        },
      },
    },
  });
  console.log(`  ✓ Citizen user: ${citizen.email}`);

  // ── Sample issue ──────────────────────────────────────────────────────────
  const issue = await prisma.issue.upsert({
    where: { id: 'seed-issue-001' },
    update: {},
    create: {
      id: 'seed-issue-001',
      title: 'Broken streetlight on MG Road',
      description: 'The streetlight near MG Road junction has been out for 3 days causing safety hazard.',
      latitude: 18.5204,
      longitude: 73.8567,
      address: 'MG Road, Pune, Maharashtra',
      state: 'Maharashtra',
      district: 'Pune',
      city: 'Pune',
      reportedById: citizen.id,
    },
  });
  console.log(`  ✓ Sample issue: ${issue.title}`);

  console.log('\n✅  Seed complete.');
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
