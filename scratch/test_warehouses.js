import prisma from '../src/config/db.js';

async function queryWarehouses() {
  try {
    const warehouses = await prisma.warehouse.findMany();
    console.log("All warehouses:");
    for (const w of warehouses) {
        console.log(`ID: ${w.id}, Tenant: ${w.tenantId}, Name: ${w.name}`);
    }
  } catch (err) {
    console.log("ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}
queryWarehouses();
