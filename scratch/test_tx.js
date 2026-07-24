import prisma from '../src/config/db.js';

async function testTransaction() {
  try {
    const order = await prisma.$transaction(async (tx) => {
        return await tx.order.create({
            data: {
                tenantId: 1, 
                orderNumber: 'ORD-TEST-0004',
                clientId: 51,
                createdById: 1, 
                status: 'draft',
                priority: 'high',
                orderType: 'Delivery',
                totalAmount: 0,
                items: {
                    create: [{
                        tenantId: 1,
                        itemId: 1,
                        warehouseId: 13,
                        quantity: 1,
                        unitPrice: 0,
                        totalPrice: 0
                    }]
                }
            },
            include: { items: true, client: true }
        });
    });
    console.log("Order created:", order.id);
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
testTransaction();
