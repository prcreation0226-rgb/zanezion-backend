import prisma from '../src/config/db.js';
import * as orderRepo from '../src/repositories/order.repository.js';

async function testOrderItems() {
    try {
        const order = await orderRepo.createOrder({
            tenantId: 1, 
            orderNumber: 'ORD-TEST-0005',
            clientId: 51,
            createdById: 1, 
            status: 'draft',
            priority: 'high',
            orderType: 'Delivery',
            totalAmount: 0
        }, [{
            itemId: 1,
            quantity: 1,
            unitPrice: 0,
            warehouseId: 13
        }], 1);
        console.log("Order created:", order.id);
    } catch (err) {
        console.log("ERROR:", err);
    } finally {
        await prisma.$disconnect();
    }
}
testOrderItems();
