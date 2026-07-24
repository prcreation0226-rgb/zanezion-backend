import prisma from '../src/config/db.js';

async function inspectAllClientsTable() {
  try {
    const clients = await prisma.client.findMany();
    console.log('Total Clients in clients table:', clients.length);

    console.log('\n--- ALL CLIENTS IN DATABASE ---');
    console.log(JSON.stringify(clients.map(c => ({
      id: c.id,
      tenantId: c.tenantId,
      name: c.companyName,
      email: c.email,
      clientType: c.clientType,
      status: c.status,
      createdAt: c.createdAt
    })), null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

inspectAllClientsTable();
