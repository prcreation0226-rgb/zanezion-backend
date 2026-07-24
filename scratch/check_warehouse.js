import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRelationsData(id) {
  try {
    const warehouseId = parseInt(id);
    const deliveries = await prisma.delivery.findMany({ where: { warehouseId } });
    console.log('Deliveries:', deliveries);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRelationsData(5);
