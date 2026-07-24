import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const deliveries = await prisma.delivery.findMany({
    include: { order: true }
  });
  console.log('Deliveries:', JSON.stringify(deliveries, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
