import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'mysql://root:XUGrYOePvFcSjLSUSYiHknUsUuYTHGcg@hopper.proxy.rlwy.net:49760/railway'
    }
  }
});

async function removeClient150() {
  try {
    const client = await prisma.client.findUnique({ where: { id: 150 } });
    if (client) {
      console.log('Deleting client 150:', client.email);
      await prisma.clientContact.deleteMany({ where: { clientId: 150 } });
      await prisma.client.delete({ where: { id: 150 } });
      if (client.email) {
        await prisma.user.updateMany({
          where: { email: client.email },
          data: { status: 'inactive', deletedAt: new Date() }
        });
      }
      console.log('✅ Client 150 deleted successfully.');
    } else {
      console.log('Client 150 not found in DB.');
    }
  } catch (err) {
    console.error('Error deleting client 150:', err);
  } finally {
    await prisma.$disconnect();
  }
}

removeClient150();
