import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();
  console.log("TENANTS:", tenants.length);

  const clients = await prisma.client.findMany();
  console.log("CLIENTS:", clients.length);

  const warehouses = await prisma.warehouse.findMany();
  console.log("WAREHOUSES:", warehouses.length);

  const orders = await prisma.order.findMany();
  console.log("ORDERS:", orders.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
