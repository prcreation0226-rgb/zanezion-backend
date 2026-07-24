import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const items = await prisma.item.findMany({
    include: {
      category: true,
      unit: true,
      inventoryStock: {
        include: {
          warehouse: true
        }
      }
    }
  });
  console.log('Items in DB:');
  console.log(items.map(i => ({
    id: i.id,
    name: i.name,
    tenantId: i.tenantId,
    inventoryStock: i.inventoryStock.map(s => ({ warehouseId: s.warehouseId, quantity: s.quantity, tenantId: s.tenantId }))
  })));

  const warehouses = await prisma.warehouse.findMany();
  console.log('Warehouses in DB:');
  console.log(warehouses.map(w => ({ id: w.id, name: w.name, tenantId: w.tenantId })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
