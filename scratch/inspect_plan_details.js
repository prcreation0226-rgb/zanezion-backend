import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'mysql://root:XUGrYOePvFcSjLSUSYiHknUsUuYTHGcg@hopper.proxy.rlwy.net:49760/railway'
    }
  }
});

async function inspectPlanDetails() {
  try {
    const plans = await prisma.plan.findMany();
    console.log('=== PLANS IN DB ===');
    plans.forEach(p => {
      console.log(`\nID: ${p.id} | Name: ${p.name} | Price: ${p.price}`);
      console.log('  planType field:', p.planType);
      console.log('  category field:', p.category);
      console.log('  features raw:', typeof p.features, p.features);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

inspectPlanDetails();
