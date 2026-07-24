import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const movements = await prisma.stockMovement.findMany({
    include: { item: true }
  });
  console.log('--- Stock Movements ---');
  console.log(movements.map(m => ({
    id: m.id,
    tenantId: m.tenantId,
    itemId: m.itemId,
    itemName: m.item?.name,
    movementType: m.movementType,
    quantity: m.quantity,
    createdAt: m.createdAt
  })));

  const losses = await prisma.lossAssessment.findMany({
    include: { item: true }
  });
  console.log('--- Loss Assessments ---');
  console.log(losses.map(l => ({
    id: l.id,
    tenantId: l.tenantId,
    itemId: l.itemId,
    itemName: l.item?.name,
    quantity: l.quantity,
    status: l.investigationStatus,
    createdAt: l.createdAt
  })));
  
  await prisma.$disconnect();
}
run();
