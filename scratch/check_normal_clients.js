import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'mysql://root:XUGrYOePvFcSjLSUSYiHknUsUuYTHGcg@hopper.proxy.rlwy.net:49760/railway'
    }
  }
});

async function checkNormalClients() {
  try {
    const users = await prisma.user.findMany({
      include: { role: true }
    });

    console.log('=== ALL USERS IN DB ===');
    users.forEach(u => {
      console.log(`ID: ${u.id} | Email: ${u.email} | Name: ${u.name} | RoleId: ${u.roleId} | RoleName: ${u.role?.name}`);
    });

    const clients = await prisma.client.findMany();
    console.log('\n=== ALL CLIENTS IN DB ===');
    clients.forEach(c => {
      console.log(`ID: ${c.id} | Email: ${c.email} | Company: ${c.companyName} | Type: ${c.type || c.clientType}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkNormalClients();
