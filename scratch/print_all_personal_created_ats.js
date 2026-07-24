import prisma from '../src/config/db.js';

async function printAllPersonalCreatedAts() {
  try {
    const clients = await prisma.client.findMany({
      where: {
        clientType: { in: ['Personal', 'individual'] }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${clients.length} Personal Clients in DB:`);
    console.log(clients.map((c, index) => ({
      index: index + 1,
      id: c.id,
      tenantId: c.tenantId,
      name: c.companyName,
      email: c.email,
      createdAt: c.createdAt
    })));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

printAllPersonalCreatedAts();
