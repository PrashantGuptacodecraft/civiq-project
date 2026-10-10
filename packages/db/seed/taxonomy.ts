import { PrismaClient, OrganizationType } from '../src/generated';
import { CIVIC_ISSUE_TAXONOMY_V1 } from '@civiq/contracts';

export async function seedTaxonomy(prisma: PrismaClient) {
  console.log('  Seeding taxonomy and standard departments...');

  // Ensure Pune jurisdiction exists (seeded in seedJurisdictions)
  const pune = await prisma.jurisdiction.findUnique({
    where: { id: 'mh-pune' },
  });

  if (!pune) {
    console.log('  ⚠️  mh-pune jurisdiction not found, skipping taxonomy seed.');
    return;
  }

  // Create or get the Municipal Corporation
  const pmc = await prisma.organization.upsert({
    where: { id: 'org-pmc' },
    update: {},
    create: {
      id: 'org-pmc',
      name: 'Pune Municipal Corporation',
      type: OrganizationType.GOVERNMENT,
      jurisdictionId: pune.id,
      verificationStatus: 'VERIFIED',
    },
  });

  // Extract unique department names from our taxonomy
  const deptMap: Record<string, string[]> = {};
  
  for (const group of CIVIC_ISSUE_TAXONOMY_V1.groups) {
    for (const category of group.categories) {
      if (!deptMap[category.defaultDepartment]) {
        deptMap[category.defaultDepartment] = [];
      }
      deptMap[category.defaultDepartment]!.push(category.id);
    }
  }

  let count = 0;
  for (const [deptName, categories] of Object.entries(deptMap)) {
    // Generate an ID for the department
    const deptId = `dept-pmc-${deptName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    
    await prisma.department.upsert({
      where: { id: deptId },
      update: {
        issueCategories: categories,
      },
      create: {
        id: deptId,
        name: deptName,
        organizationId: pmc.id,
        issueCategories: categories,
      },
    });
    count++;
  }

  console.log(`  ✅ Seeded ${count} standard departments with taxonomy mapping`);
}
