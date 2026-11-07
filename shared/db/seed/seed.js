import { PrismaClient, Role } from '../src/generated/index.js';
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes, scryptSync } from 'node:crypto';

function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${derivedKey}`;
}
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
    async function processNode(node, parentId = null) {
        const data = {
            id: node.id,
            name: node.name,
            type: node.type,
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
import { seedTaxonomy } from './taxonomy.js';
async function main() {
    console.log('🌱  Seeding database...');
    await seedJurisdictions();
    await seedTaxonomy(prisma);
    // ── Platform super admin ──────────────────────────────────────────────────
    const admin = await prisma.user.upsert({
        where: { email: 'admin@civiq.dev' },
        update: {
            passwordHash: hashPassword('Admin@123456'),
        },
        create: {
            email: 'admin@civiq.dev',
            passwordHash: hashPassword('Admin@123456'),
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
    console.log(`  ✓ Admin user: ${admin.email} (Password: Admin@123456)`);

    // ── Department Officer ───────────────────────────────────────────────────
    const officer = await prisma.user.upsert({
        where: { email: 'officer@pune.gov.in' },
        update: {
            passwordHash: hashPassword('Officer@123456'),
        },
        create: {
            email: 'officer@pune.gov.in',
            passwordHash: hashPassword('Officer@123456'),
            role: Role.DEPARTMENT_OFFICER,
            profile: {
                create: {
                    displayName: 'Officer Rajesh Patil',
                    state: 'Maharashtra',
                    district: 'Pune',
                    city: 'Pune',
                },
            },
        },
    });
    console.log(`  ✓ Department Officer: ${officer.email} (Password: Officer@123456)`);

    // ── Verification Officer ─────────────────────────────────────────────────
    const verifyOfficer = await prisma.user.upsert({
        where: { email: 'verify@pune.gov.in' },
        update: {
            passwordHash: hashPassword('Verify@123456'),
        },
        create: {
            email: 'verify@pune.gov.in',
            passwordHash: hashPassword('Verify@123456'),
            role: Role.VERIFICATION_OFFICER,
            profile: {
                create: {
                    displayName: 'Verification Officer Sunita Roy',
                    state: 'Maharashtra',
                    district: 'Pune',
                    city: 'Pune',
                },
            },
        },
    });
    console.log(`  ✓ Verification Officer: ${verifyOfficer.email} (Password: Verify@123456)`);

    // ── Field Worker ─────────────────────────────────────────────────────────
    const fieldWorker = await prisma.user.upsert({
        where: { email: 'worker@pune.gov.in' },
        update: {
            passwordHash: hashPassword('Worker@123456'),
        },
        create: {
            email: 'worker@pune.gov.in',
            passwordHash: hashPassword('Worker@123456'),
            role: Role.FIELD_WORKER,
            profile: {
                create: {
                    displayName: 'Field Worker Ramesh Kadam',
                    state: 'Maharashtra',
                    district: 'Pune',
                    city: 'Pune',
                },
            },
        },
    });
    console.log(`  ✓ Field Worker: ${fieldWorker.email} (Password: Worker@123456)`);

    // ── Disaster Coordinator ─────────────────────────────────────────────────
    const disasterCoord = await prisma.user.upsert({
        where: { email: 'disaster@pune.gov.in' },
        update: {
            passwordHash: hashPassword('Disaster@123456'),
        },
        create: {
            email: 'disaster@pune.gov.in',
            passwordHash: hashPassword('Disaster@123456'),
            role: Role.DISASTER_COORDINATOR,
            profile: {
                create: {
                    displayName: 'Disaster Commander Deshmukh',
                    state: 'Maharashtra',
                    district: 'Pune',
                    city: 'Pune',
                },
            },
        },
    });
    console.log(`  ✓ Disaster Coordinator: ${disasterCoord.email} (Password: Disaster@123456)`);

    // ── Sample citizen ────────────────────────────────────────────────────────
    const citizen = await prisma.user.upsert({
        where: { email: 'citizen@civiq.dev' },
        update: {
            phone: '+919876543210',
            passwordHash: hashPassword('Citizen@123456'),
        },
        create: {
            email: 'citizen@civiq.dev',
            phone: '+919876543210',
            passwordHash: hashPassword('Citizen@123456'),
            role: Role.CITIZEN,
            profile: {
                create: {
                    displayName: 'Priya Sharma',
                    state: 'Maharashtra',
                    district: 'Pune',
                    city: 'Pune',
                },
            },
        },
    });
    console.log(`  ✓ Citizen user: ${citizen.email} (Phone: +919876543210, Password: Citizen@123456)`);
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
