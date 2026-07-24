import prisma from '../src/config/db.js';

async function testCreateOrderAndDelivery() {
  try {
    const newOrder = await prisma.order.create({
      data: {
        tenantId: 1, 
        orderNumber: 'ORD-TEST-0003',
        clientId: 51,
        createdById: 1, 
        status: 'draft',
        priority: 'high',
        orderType: 'Delivery',
        totalAmount: 0
      }
    });
    console.log("Order created successfully:", newOrder.id);

    const newDelivery = await prisma.delivery.create({
        data: {
            tenantId: 1,
            deliveryNumber: 'DEL-TEST-0003',
            orderId: newOrder.id,
            clientId: 51,
            warehouseId: 13, // USE VALID WAREHOUSE
            missionType: 'Delivery',
            transportMode: 'Road'
        }
    });
    console.log("Delivery created successfully:", newDelivery.id);
  } catch (err) {
    console.log("ERROR:");
    console.log(err.name);
    console.log(err.code);
    console.log(err.message);
    if (err.meta) console.log(err.meta);
  } finally {
    await prisma.$disconnect();
  }
}

testCreateOrderAndDelivery();
