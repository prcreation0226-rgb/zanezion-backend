import prisma from './src/config/db.js';
import * as deliveryService from './src/services/delivery.service.js';

async function test() {
  console.log("=== STARTING STOCK DECREMENT INTEGRATION TEST ===");

  // 1. Reset babu supari stock in Nassau Main Depot (warehouseId 1, itemId 21) to 10
  console.log("Resetting babu supari stock...");
  await prisma.inventoryStock.upsert({
    where: { warehouseId_itemId: { warehouseId: 1, itemId: 21 } },
    update: { quantity: 10, reservedQuantity: 10 },
    create: { warehouseId: 1, itemId: 21, quantity: 10, reservedQuantity: 10, tenantId: 1 }
  });

  // Verify stock is 10
  const stockBefore = await prisma.inventoryStock.findUnique({
    where: { warehouseId_itemId: { warehouseId: 1, itemId: 21 } }
  });
  console.log(`Stock before test: ${stockBefore.quantity}`);

  // 2. Create delivery manually for 1 qty of babu supari
  console.log("Creating manual delivery for 1 qty of babu supari...");
  const delivery = await deliveryService.createDelivery({
    pickupLocation: 'Nassau Main Depot',
    dropLocation: 'Lyford Cay',
    missionType: 'Delivery',
    warehouseId: 1,
    items: [
      {
        itemId: 21,
        quantity: 1
      }
    ]
  }, 1, 1); // tenantId = 1, performerId = 1

  console.log(`Delivery created successfully. ID: ${delivery.id}, Delivery Number: ${delivery.deliveryNumber}, Status: ${delivery.status}`);

  // 3. Update delivery status to en_route (Start Trip)
  console.log("Updating delivery status to 'en_route' (Start Trip)...");
  await deliveryService.updateDelivery(delivery.id, { status: 'en_route' }, 1, 1);

  // 4. Verify stock is now 9
  const stockAfter = await prisma.inventoryStock.findUnique({
    where: { warehouseId_itemId: { warehouseId: 1, itemId: 21 } }
  });
  console.log(`Stock after test: ${stockAfter.quantity}`);

  if (stockAfter.quantity === 9) {
    console.log("SUCCESS: Stock decremented correctly to 9!");
  } else {
    console.error(`FAILURE: Stock is ${stockAfter.quantity}, expected 9.`);
  }

  // Check if stock movement log was generated
  const movements = await prisma.stockMovement.findMany({
    where: { itemId: 21, warehouseId: 1 },
    orderBy: { createdAt: 'desc' },
    take: 1
  });
  if (movements.length > 0) {
    console.log(`Stock Movement Log Found: Type=${movements[0].movementType}, Qty=${movements[0].quantity}, Remarks=${movements[0].remarks}`);
  } else {
    console.error("FAILURE: No stock movement log found.");
  }
}

test().catch(console.error).finally(() => prisma.$disconnect());
