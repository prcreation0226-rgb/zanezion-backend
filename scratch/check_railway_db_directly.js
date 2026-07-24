import prisma from '../src/config/db.js';

async function checkRailwayDbDirectly() {
  try {
    const emails = ['deepu@gmail.com', 'chotu@gmail.com', 'testing@gmail.com', 'qwerty@gmail.com', 'qwertyuio@gmail.com'];

    console.log('--- USERS TABLE IN RAILWAY DB ---');
    const users = await prisma.user.findMany({
      where: { email: { in: emails } }
    });
    console.log(users.map(u => ({ id: u.id, email: u.email, tenantId: u.tenantId, roleId: u.roleId })));

    console.log('\n--- CLIENTS TABLE IN RAILWAY DB ---');
    const clients = await prisma.client.findMany({
      where: { email: { in: emails } }
    });
    console.log(clients.map(c => ({ id: c.id, email: c.email, tenantId: c.tenantId, clientType: c.clientType })));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkRailwayDbDirectly();
