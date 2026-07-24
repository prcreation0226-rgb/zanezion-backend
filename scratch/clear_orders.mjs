import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function clearOrders() {
  console.log('Forcefully deleting all orders and associated data...');

  const activeOrders = await p.order.findMany({
    where: { 
      status: { notIn: ['delivered', 'cancelled'] },
      orderType: 'DELIVERY'
    },
    include: { items: true }
  });

  for (const order of activeOrders) {
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        if (!item.warehouseId || !item.itemId) continue;
        const stock = await p.inventoryStock.findUnique({
          where: { warehouseId_itemId: { warehouseId: item.warehouseId, itemId: item.itemId } }
        });
        if (stock) {
          const decrementVal = Math.min(stock.reservedQuantity, item.quantity);
          await p.inventoryStock.update({
            where: { id: stock.id },
            data: { reservedQuantity: { decrement: decrementVal } }
          });
        }
      }
    }
  }

  // Proper cascade delete order
  try {
    // Delete payments and invoices
    await p.receipt.deleteMany({});
    await p.payment.deleteMany({});
    await p.invoiceItem.deleteMany({});
    await p.invoice.deleteMany({});
    
    // Delete deliveries
    await p.deliveryItem.deleteMany({});
    await p.delivery.deleteMany({}); // assuming delivery routes don't exist yet or cascade properly
    
    // Delete order items and missions
    await p.orderItem.deleteMany({});
    await p.mission.deleteMany({});
    
    // Now forcefully delete orders
    await p.order.deleteMany({});
    console.log('All orders successfully deleted.');
  } catch (error) {
    console.error('Error deleting orders:', error.message);
  }
}

clearOrders().catch(console.error).finally(() => p.$disconnect());
