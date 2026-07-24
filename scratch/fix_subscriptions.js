import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSubscriptions() {
  console.log('=== FIXING SUBSCRIPTIONS ===\n');

  // 1. List all subscriptions
  const allSubs = await prisma.subscription.findMany({
    include: { plan: true }
  });
  console.log(`Total subscriptions in DB: ${allSubs.length}`);
  for (const s of allSubs) {
    console.log(`  Sub ID: ${s.id} | TenantId: ${s.tenantId} | Plan: ${s.plan?.name || 'N/A'} | Status: ${s.status} | End: ${s.endDate}`);
  }

  // 2. List all plans
  const plans = await prisma.plan.findMany();
  console.log(`\nTotal plans in DB: ${plans.length}`);
  for (const p of plans) {
    console.log(`  Plan ID: ${p.id} | Name: ${p.name} | MaxUsers: ${p.maxUsers} | Price: ${p.price}`);
  }

  // 3. For tenant 10 (saas_client), check if a subscription exists
  const tenant10Sub = allSubs.find(s => s.tenantId === 10);
  if (tenant10Sub) {
    console.log(`\nTenant 10 has subscription ID: ${tenant10Sub.id}, linking it...`);
    // Link it as active subscription
    await prisma.tenant.update({
      where: { id: 10 },
      data: { subscriptionId: tenant10Sub.id }
    });
    // Ensure status is ACTIVE
    await prisma.subscription.update({
      where: { id: tenant10Sub.id },
      data: { status: 'ACTIVE' }
    });
    console.log('Done! Linked and activated.');
  } else {
    console.log('\nTenant 10 has NO subscription. Creating one...');
    // Find a suitable plan (e.g., Platinum or the first available)
    const bestPlan = plans.find(p => p.name?.toLowerCase().includes('plat')) || plans.find(p => p.name?.toLowerCase().includes('premium')) || plans[0];
    if (!bestPlan) {
      console.log('ERROR: No plans exist in the database. Create a plan first.');
      await prisma.$disconnect();
      return;
    }

    console.log(`Using plan: ${bestPlan.name} (ID: ${bestPlan.id}, MaxUsers: ${bestPlan.maxUsers})`);

    const newSub = await prisma.subscription.create({
      data: {
        tenantId: 10,
        planId: bestPlan.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        status: 'ACTIVE',
        paymentStatus: 'PAID',
        autoRenew: true
      }
    });

    console.log(`Created subscription ID: ${newSub.id}`);

    // Link to tenant
    await prisma.tenant.update({
      where: { id: 10 },
      data: { subscriptionId: newSub.id }
    });
    console.log('Linked subscription to tenant 10!');
  }

  // 4. Verify the fix
  const fixed = await prisma.tenant.findUnique({
    where: { id: 10 },
    include: { activeSubscription: { include: { plan: true } } }
  });
  console.log(`\n=== VERIFICATION ===`);
  console.log(`Tenant 10 status: ${fixed.status}`);
  console.log(`Subscription: ${fixed.activeSubscription ? `ID=${fixed.activeSubscription.id}, Status=${fixed.activeSubscription.status}, Plan=${fixed.activeSubscription.plan?.name}` : 'STILL NONE'}`);

  console.log('\n=== DONE ===');
  await prisma.$disconnect();
}

fixSubscriptions().catch(e => {
  console.error(e);
  prisma.$disconnect();
});
