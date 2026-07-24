import { createDelivery } from './src/services/delivery.service.js';
import prisma from './src/config/db.js';

async function test() {
  try {
    const data = {
      orderId: null,
      clientId: null,
      warehouseId: null,
      missionType: 'Delivery',
      items: [{ itemId: 1, quantity: 1 }]
    };
    
    console.log('Testing createDelivery...');
    const result = await createDelivery(data, 1, 1);
    console.log('Success:', result.id);
  } catch (err) {
    console.error('FAILED:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
