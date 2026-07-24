import prisma from '../src/config/db.js';

async function checkTenant1Personal() {
  try {
    const tenant1Personal = await prisma.client.findMany({
      where: {
        tenantId: 1,
        clientType: { in: ['Personal', 'individual'] }
      }
    });

    console.log('Tenant 1 Personal Clients Count:', tenant1Personal.length);
    console.log(JSON.stringify(tenant1Personal, null, 2));

    const allPersonal = await prisma.client.findMany({
      where: {
        clientType: { in: ['Personal', 'individual'] }
      }
    });

    console.log('ALL Tenants Personal Clients Count:', allPersonal.length);
    console.log(JSON.stringify(allPersonal.map(c => ({ id: c.id, tenantId: c.tenantId, email: c.email, clientType: c.clientType, source: c.source })), null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkTenant1Personal();
