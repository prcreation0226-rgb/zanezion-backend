import prisma from '../src/config/db.js';
import * as deliveryService from '../src/services/delivery.service.js';

async function test() {
  try {
    const data = {
      orderId: null, 
      clientId: 51,
      missionType: 'Delivery',
      transportMode: 'Road',
      items: [{
        orderItemId: null,
        itemId: 1,
        quantity: 1
      }],
      pickupLocation: 'TBD - Warehouse',
      dropLocation: 'Test Location'
    };
    
    // Performer: Logistics user (tenantId = 1)
    await deliveryService.createDelivery(data, 1, 1);
    console.log("Success");
  } catch (err) {
    console.log("ERROR:");
    console.log(err.name);
    console.log(err.code);
    console.log(err.message);
    if (err.meta) console.log(err.meta);
  }
}

test().finally(() => prisma.$disconnect());
