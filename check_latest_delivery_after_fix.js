import prisma from './src/config/db.js';

async function check() {
  console.log("=== CHECKING LATEST DELIVERY AND ITEMS ===");
  const latestDelivery = await prisma.delivery.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: { item: true }
      }
    }
  });

  if (!latestDelivery) {
    console.log("No deliveries found!");
    return;
  }

  console.log(`Delivery ID: ${latestDelivery.id}`);
  console.log(`Delivery Number: ${latestDelivery.deliveryNumber}`);
  console.log(`Status: ${latestDelivery.status}`);
  console.log(`Warehouse ID: ${latestDelivery.warehouseId}`);
  console.log(`CreatedAt: ${latestDelivery.createdAt}`);
  
  console.log("Items:");
  latestDelivery.items.forEach(it => {
    console.log(`- ItemId: ${it.itemId}, Name: ${it.item?.name}, Qty: ${it.quantity}`);
  });
}

check().catch(console.error).finally(() => prisma.$disconnect());
