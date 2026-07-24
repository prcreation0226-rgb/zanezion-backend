import prisma from '../src/config/db.js';

async function query() {
  try {
    const orderId = 'ORD-2026-0157';
    console.log("Looking for order", orderId);
    let order = await prisma.order.findFirst({
        where: { orderNumber: orderId }
    });
    console.log("Order found:", order);
    
    if (order) {
        console.log("Order tenantId:", order.tenantId);
        console.log("Order clientId:", order.clientId);
    }

    const t1clients = await prisma.client.findMany({ where: { tenantId: 1 } });
    console.log("Tenant 1 clients:", t1clients.map(c => ({ id: c.id, name: c.companyName })));

    const t2clients = await prisma.client.findMany({ where: { tenantId: 2 } });
    console.log("Tenant 2 clients:", t2clients.map(c => ({ id: c.id, name: c.companyName })));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
query();
