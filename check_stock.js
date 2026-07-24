import prisma from './src/config/db.js';

async function check() {
  console.log("=== CHECKING STOCK RECORDS ===");
  const stocks = await prisma.inventoryStock.findMany({
    include: {
      item: true,
      warehouse: true
    }
  });
  stocks.forEach(s => {
    console.log(`Stock ID: ${s.id}, Warehouse: ${s.warehouse?.name} (ID: ${s.warehouseId}), Item: ${s.item?.name} (ID: ${s.itemId}), Qty: ${s.quantity}`);
  });
}

check().catch(console.error).finally(() => prisma.$disconnect());
