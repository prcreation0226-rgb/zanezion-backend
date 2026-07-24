import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({log: ['query']});

async function run() {
  try {
    const tx = await prisma.$transaction(async (tx) => {
      await tx.invoice.updateMany({ where: { deliveryId: 62 }, data: { deliveryId: null } });
      await tx.proofOfDelivery.deleteMany({ where: { deliveryId: 62 } });
      await tx.mission.deleteMany({ where: { deliveryId: 62 } });
      await tx.deliveryItem.deleteMany({ where: { deliveryId: 62 } });
      await tx.delivery.delete({ where: { id: 62 } });
    });
    console.log('success');
  } catch (e) {
    console.error(e);
  }
}
run();
