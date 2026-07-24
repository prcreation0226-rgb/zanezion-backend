import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const pr = await prisma.purchaseRequest.findFirst({
    where: { prNumber: 'PR-2026-0008' },
    include: {
      requester: true
    }
  });
  console.log('PR-2026-0008:', pr);
  await prisma.$disconnect();
}
run();
