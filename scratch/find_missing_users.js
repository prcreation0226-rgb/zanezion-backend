import prisma from '../src/config/db.js';

async function findMissingUsers() {
  try {
    const emails = ['testing@gmail.com', 'qwerty@gmail.com', 'qwertyuio@gmail.com'];

    console.log('--- USERS TABLE ---');
    const users = await prisma.user.findMany({
      where: { email: { in: emails } }
    });
    console.log(JSON.stringify(users.map(u => ({
      id: u.id,
      email: u.email,
      roleId: u.roleId,
      tenantId: u.tenantId,
      status: u.status,
      deletedAt: u.deletedAt
    })), null, 2));

    console.log('\n--- CLIENTS TABLE ---');
    const clients = await prisma.client.findMany({
      where: { email: { in: emails } }
    });
    console.log(JSON.stringify(clients.map(c => ({
      id: c.id,
      tenantId: c.tenantId,
      email: c.email,
      clientType: c.clientType,
      status: c.status,
      source: c.source
    })), null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

findMissingUsers();
