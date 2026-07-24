import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnoseTenants() {
  console.log('=== TENANT DIAGNOSTIC ===\n');

  // 1. List all tenants and their statuses
  const tenants = await prisma.tenant.findMany({
    include: {
      organization: true,
      activeSubscription: {
        include: { plan: true }
      }
    }
  });

  for (const t of tenants) {
    console.log(`Tenant ID: ${t.id}`);
    console.log(`  Code: ${t.tenantCode}`);
    console.log(`  Status: "${t.status}" (type: ${typeof t.status})`);
    console.log(`  Org: ${t.organization?.name || 'N/A'}`);
    console.log(`  SubscriptionId: ${t.subscriptionId || 'NULL'}`);
    if (t.activeSubscription) {
      console.log(`  Subscription Status: "${t.activeSubscription.status}"`);
      console.log(`  Plan: ${t.activeSubscription.plan?.name || 'N/A'}`);
      console.log(`  End Date: ${t.activeSubscription.endDate}`);
    } else {
      console.log(`  Subscription: NONE LINKED`);
    }

    // Count users for this tenant
    const userCount = await prisma.user.count({ where: { tenantId: t.id } });
    console.log(`  Users: ${userCount}`);
    console.log('');
  }

  // 2. List all SaaS client users and their tenantIds
  console.log('=== SAAS CLIENT USERS ===\n');
  const saasRole = await prisma.role.findUnique({ where: { name: 'SAAS_CLIENT' } });
  if (saasRole) {
    const saasUsers = await prisma.user.findMany({
      where: { roleId: saasRole.id },
      select: { id: true, name: true, email: true, tenantId: true, status: true }
    });
    for (const u of saasUsers) {
      console.log(`User: ${u.name} (${u.email}) | tenantId: ${u.tenantId} | status: ${u.status}`);
    }
  } else {
    console.log('SAAS_CLIENT role not found!');
  }

  // 3. Fix: Set all tenant statuses to 'active'
  console.log('\n=== FIXING ALL TENANT STATUSES TO active ===');
  const result = await prisma.tenant.updateMany({
    data: { status: 'active' }
  });
  console.log(`Updated ${result.count} tenant(s) to status=active`);

  // 4. Fix: Ensure all subscriptions linked to tenants are ACTIVE
  const subs = await prisma.subscription.findMany({
    where: { tenantSubscriptions: { some: {} } }
  });
  console.log(`\nFound ${subs.length} subscription(s) linked to tenants`);
  for (const s of subs) {
    if (s.status !== 'ACTIVE') {
      await prisma.subscription.update({
        where: { id: s.id },
        data: { status: 'ACTIVE' }
      });
      console.log(`  Fixed subscription ${s.id}: "${s.status}" -> "ACTIVE"`);
    }
  }

  console.log('\n=== DONE ===');
  await prisma.$disconnect();
}

diagnoseTenants().catch(e => {
  console.error(e);
  prisma.$disconnect();
});
