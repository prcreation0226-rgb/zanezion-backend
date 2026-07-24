import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'mysql://root:XUGrYOePvFcSjLSUSYiHknUsUuYTHGcg@hopper.proxy.rlwy.net:49760/railway'
    }
  }
});

async function checkTenantIds() {
  try {
    const superadmin = await prisma.user.findFirst({
      where: { email: 'superadmin@zanezion.com' },
      include: { role: true }
    });
    console.log('Superadmin user:', superadmin);

    const client150 = await prisma.client.findFirst({
      where: { id: 150 }
    });
    console.log('Client 150:', client150);

    const allClients = await prisma.client.findMany();
    console.log('\nAll clients count:', allClients.length);
    allClients.forEach(c => console.log(`Client ID ${c.id}: tenantId=${c.tenantId}, email=${c.email}, type=${c.clientType}`));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkTenantIds();
