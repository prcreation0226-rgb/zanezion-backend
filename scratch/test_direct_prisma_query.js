import prisma from '../src/config/db.js';

async function testDirectPrismaQuery() {
  try {
    const where = {
      clientType: { in: ['Personal', 'individual'] }
    };

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.client.count({ where })
    ]);

    console.log('--- DIRECT PRISMA QUERY RESULT ---');
    console.log('Total Count in DB:', total);
    console.log('Clients count returned:', clients.length);
    console.log('Clients:', clients.map(c => ({ id: c.id, email: c.email, tenantId: c.tenantId, clientType: c.clientType, createdAt: c.createdAt })));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

testDirectPrismaQuery();
