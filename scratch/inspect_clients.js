import prisma from '../src/config/db.js';

async function checkClients() {
  try {
    const clients = await prisma.client.findMany();
    console.log('Total clients in DB:', clients.length);
    console.log(JSON.stringify(clients.map(c => ({
      id: c.id,
      tenantId: c.tenantId,
      companyName: c.companyName,
      contactPerson: c.contactPerson,
      email: c.email,
      clientType: c.clientType,
      source: c.source,
      plan: c.plan
    })), null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkClients();
