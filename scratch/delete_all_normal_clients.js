import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'mysql://root:XUGrYOePvFcSjLSUSYiHknUsUuYTHGcg@hopper.proxy.rlwy.net:49760/railway'
    }
  }
});

async function deleteAllNormalClients() {
  try {
    const normalClients = await prisma.client.findMany({
      where: {
        OR: [
          { clientType: 'Personal' },
          { clientType: 'personal' }
        ]
      }
    });

    console.log(`Found ${normalClients.length} Personal/Normal clients to delete.`);

    for (const client of normalClients) {
      console.log(`Deleting client ID ${client.id} (${client.email})...`);
      
      const invoices = await prisma.invoice.findMany({ where: { clientId: client.id }, select: { id: true } });
      const invoiceIds = invoices.map(i => i.id);
      if (invoiceIds.length > 0) {
        const payments = await prisma.payment.findMany({ where: { invoiceId: { in: invoiceIds } }, select: { id: true } });
        const paymentIds = payments.map(p => p.id);
        if (paymentIds.length > 0) {
          await prisma.receipt.deleteMany({ where: { paymentId: { in: paymentIds } } });
        }
        await prisma.payment.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
        await prisma.invoiceItem.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
        await prisma.invoice.deleteMany({ where: { id: { in: invoiceIds } } });
      }

      const deliveries = await prisma.delivery.findMany({ where: { clientId: client.id }, select: { id: true } });
      const deliveryIds = deliveries.map(d => d.id);
      if (deliveryIds.length > 0) {
        await prisma.proofOfDelivery.deleteMany({ where: { deliveryId: { in: deliveryIds } } });
        await prisma.mission.deleteMany({ where: { deliveryId: { in: deliveryIds } } });
        await prisma.deliveryItem.deleteMany({ where: { deliveryId: { in: deliveryIds } } });
        await prisma.delivery.deleteMany({ where: { id: { in: deliveryIds } } });
      }

      const orders = await prisma.order.findMany({ where: { clientId: client.id }, select: { id: true } });
      const orderIds = orders.map(o => o.id);
      if (orderIds.length > 0) {
        await prisma.mission.deleteMany({ where: { orderId: { in: orderIds } } });
        await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
        await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
      }

      await prisma.clientContact.deleteMany({ where: { clientId: client.id } });
      await prisma.client.delete({ where: { id: client.id } });

      if (client.email) {
        try {
          await prisma.user.deleteMany({
            where: {
              email: client.email,
              roleId: 13
            }
          });
        } catch {
          await prisma.user.updateMany({
            where: { email: client.email },
            data: { status: 'inactive', deletedAt: new Date() }
          });
        }
      }

      console.log(`✅ Successfully deleted client ID: ${client.id}`);
    }

    const remainingNormalClients = await prisma.client.count({
      where: {
        OR: [
          { clientType: 'Personal' },
          { clientType: 'personal' }
        ]
      }
    });

    console.log(`\nRemaining Normal Clients count in DB: ${remainingNormalClients}`);

  } catch (err) {
    console.error('❌ Error during deletion:', err);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllNormalClients();
