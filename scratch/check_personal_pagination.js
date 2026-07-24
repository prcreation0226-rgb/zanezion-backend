import prisma from '../src/config/db.js';

async function checkPersonalClients() {
  try {
    const clients = await prisma.client.findMany({
      where: {
        clientType: { in: ['Personal', 'individual'] }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('Total Personal Clients in DB:', clients.length);
    console.log(JSON.stringify(clients.map((c, i) => ({
      index: i + 1,
      id: c.id,
      companyName: c.companyName,
      email: c.email,
      clientType: c.clientType,
      createdAt: c.createdAt
    })), null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkPersonalClients();
