import prisma from './src/config/db.js';

async function seedTestData() {
  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Zanezion Test Org',
      email: 'org@test.com',
      status: 'active'
    }
  });

  // 2. Create Tenant
  const tenant = await prisma.tenant.create({
    data: {
      organizationId: org.id,
      tenantCode: 'TEST-TN-' + Date.now(),
      status: 'active'
    }
  });

  // 3. Create Category
  const category = await prisma.itemCategory.create({
    data: {
      tenantId: tenant.id,
      name: 'General',
      status: 'active'
    }
  });

  // 4. Create Unit
  const unit = await prisma.itemUnit.create({
    data: {
      tenantId: tenant.id,
      name: 'Pieces',
      shortName: 'pcs',
      status: 'active'
    }
  });

  // 5. Update admin user to have this tenantId
  await prisma.user.update({
    where: { email: 'admin@zanezion.com' },
    data: { tenantId: tenant.id }
  });

  console.log(`Seeded Tenant ID: ${tenant.id}`);
  console.log(`Seeded Category ID: ${category.id}`);
  console.log(`Seeded Unit ID: ${unit.id}`);
}

seedTestData().catch(e => console.error(e)).finally(() => prisma.$disconnect());
