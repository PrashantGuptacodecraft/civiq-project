import { PrismaClient, Role, JurisdictionType } from '../src/generated';
import fs from 'node:fs';
import path from 'node:path';

const prisma = new PrismaClient();

async function seedJurisdictions() {
  console.log('  Seeding jurisdictions...');
  const dataPath = path.resolve(__dirname, '../../../scripts/seeds/jurisdiction.json');
  if (!fs.existsSync(dataPath)) {
    console.log('  ⚠️  jurisdiction.json not found, skipping jurisdiction seed.');
    return;
  }

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const jurisdictions = JSON.parse(rawData);

  async function processNode(node: any, parentId: string | null = null) {
    const data = {
      id: node.id,
      name: node.name,
      type: node.type as JurisdictionType,
      lgdCode: node.lgdCode,
      parentId,
    };

    const record = await prisma.jurisdiction.upsert({
      where: { id: node.id },
      update: data,
      create: data,
    });

    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        await processNode(child, record.id);
      }
    }
  }

  for (const rootNode of jurisdictions) {
    await processNode(rootNode);
  }
  
  const count = await prisma.jurisdiction.count();
  console.log(`  ✓ Seeded ${count} jurisdictions`);

  // Integrity Check
  const pune = await prisma.jurisdiction.findUnique({
    where: { id: 'mh-pune' },
    include: { parent: true }
  });
  if (pune?.parent?.id !== 'mh') {
    throw new Error('Integrity Check Failed: Pune is not a child of Maharashtra');
  }
  console.log(`  ✓ Integrity check passed: ${pune.name} belongs to ${pune.parent.name}`);
}

async function main(): Promise<void> {
  console.log('🌱  Seeding database...');

  await seedJurisdictions();

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
