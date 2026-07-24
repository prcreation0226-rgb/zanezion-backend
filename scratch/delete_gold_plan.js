import prisma from '../src/config/db.js';

async function forceDeleteGoldPlan() {
  try {
    console.log('Searching for plans...');
    const plans = await prisma.plan.findMany();
    console.log('All Plans in Database:', JSON.stringify(plans, null, 2));

    for (const plan of plans) {
      console.log(`Force cleaning and deleting Plan ID: ${plan.id} (${plan.name})...`);
      
      // Delete any subscription references
      const subs = await prisma.subscription.findMany({ where: { planId: plan.id } });
      console.log(`Found ${subs.length} subscriptions for plan ${plan.id}`);
      
      for (const sub of subs) {
        // Clear active subscription from tenants
        await prisma.tenant.updateMany({
          where: { subscriptionId: sub.id },
          data: { subscriptionId: null }
        });
        await prisma.subscription.delete({ where: { id: sub.id } });
      }

      // Delete the plan
      await prisma.plan.delete({ where: { id: plan.id } });
      console.log(`Plan ID ${plan.id} (${plan.name}) FORCE DELETED successfully!`);
    }

    console.log('Done!');
  } catch (error) {
    console.error('Error force deleting plans:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceDeleteGoldPlan();
