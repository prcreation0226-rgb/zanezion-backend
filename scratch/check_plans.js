import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'mysql://root:XUGrYOePvFcSjLSUSYiHknUsUuYTHGcg@hopper.proxy.rlwy.net:49760/railway'
    }
  }
});

async function checkPlans() {
  try {
    const plans = await prisma.plan.findMany();
    console.log(`Found ${plans.length} plans in DB:`);
    plans.forEach(p => {
      console.log(`ID: ${p.id} | Name: ${p.name} | Price: $${p.price} | PlanType: ${p.planType} | Category: ${p.category} | Features: ${p.features}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlans();
