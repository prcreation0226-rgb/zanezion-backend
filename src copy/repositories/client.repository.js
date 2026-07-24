import prisma from '../config/db.js';

// --- Client Methods ---

export const createClient = async (data) => {
  return await prisma.client.create({ data });
};

export const findClientById = async (id) => {
  return await prisma.client.findUnique({
    where: { id },
    include: { contacts: true }
  });
};

export const findClientByCode = async (clientCode, tenantId) => {
  return await prisma.client.findFirst({
    where: { clientCode, ...(tenantId != null && { tenantId }) }
  });
};

export const findAllClients = async (tenantId, query) => {
  const { page = 1, limit = 10, search = '', status, clientType } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(tenantId !== null && { tenantId }),
    ...(search && {
      OR: [
        { companyName: { contains: search } },
        { clientCode: { contains: search } },
        { email: { contains: search } }
      ]
    }),
    ...(status && { status }),
    ...(clientType && { clientType })
  };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.client.count({ where })
  ]);

  return { clients, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

export const updateClient = async (id, data) => {
  return await prisma.client.update({
    where: { id },
    data
  });
};

export const deleteClient = async (id) => {
  // First, get the client so we know the email
  const client = await prisma.client.findUnique({ where: { id } });

  return await prisma.$transaction(async (tx) => {
    // 1. Get all invoices for the client to delete payments and receipts
    const invoices = await tx.invoice.findMany({
      where: { clientId: id },
      select: { id: true }
    });
    const invoiceIds = invoices.map(i => i.id);

    if (invoiceIds.length > 0) {
      // Get all payments linked to these invoices
      const payments = await tx.payment.findMany({
        where: { invoiceId: { in: invoiceIds } },
        select: { id: true }
      });
      const paymentIds = payments.map(p => p.id);

      if (paymentIds.length > 0) {
        // Delete receipts
        await tx.receipt.deleteMany({
          where: { paymentId: { in: paymentIds } }
        });
      }

      // Delete payments
      await tx.payment.deleteMany({
        where: { invoiceId: { in: invoiceIds } }
      });

      // Delete invoice items
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: { in: invoiceIds } }
      });

      // Delete invoices
      await tx.invoice.deleteMany({
        where: { id: { in: invoiceIds } }
      });
    }

    // 2. Get all deliveries for the client
    const deliveries = await tx.delivery.findMany({
      where: { clientId: id },
      select: { id: true }
    });
    const deliveryIds = deliveries.map(d => d.id);

    if (deliveryIds.length > 0) {
      // Delete proofs of delivery
      await tx.proofOfDelivery.deleteMany({
        where: { deliveryId: { in: deliveryIds } }
      });

      // Delete missions linked to deliveries
      await tx.mission.deleteMany({
        where: { deliveryId: { in: deliveryIds } }
      });

      // Delete delivery items
      await tx.deliveryItem.deleteMany({
        where: { deliveryId: { in: deliveryIds } }
      });

      // Delete deliveries
      await tx.delivery.deleteMany({
        where: { id: { in: deliveryIds } }
      });
    }

    // 3. Get all orders for the client
    const orders = await tx.order.findMany({
      where: { clientId: id },
      select: { id: true }
    });
    const orderIds = orders.map(o => o.id);

    if (orderIds.length > 0) {
      // Delete missions linked to orders (which are not linked to deliveries)
      await tx.mission.deleteMany({
        where: { orderId: { in: orderIds } }
      });

      // Delete order items
      await tx.orderItem.deleteMany({
        where: { orderId: { in: orderIds } }
      });

      // Delete orders
      await tx.order.deleteMany({
        where: { id: { in: orderIds } }
      });
    }

    // 4. Delete client contacts
    await tx.clientContact.deleteMany({
      where: { clientId: id }
    });

    // 5. Delete the client itself
    await tx.client.delete({ where: { id } });

    // 6. Soft delete the associated user so they cannot login
    if (client && client.email) {
      await tx.user.updateMany({
        where: { email: client.email },
        data: { deletedAt: new Date(), status: 'inactive' }
      });
    }

    return true;
  });
};

// --- Client Contact Methods ---

export const createClientContact = async (clientId, data, tenantId) => {
  if (data.isPrimary) {
    // Reset other primary contacts for this client
    await prisma.clientContact.updateMany({
      where: { clientId, tenantId },
      data: { isPrimary: false }
    });
  }
  return await prisma.clientContact.create({
    data: { ...data, clientId, tenantId }
  });
};

export const deleteClientContact = async (id) => {
  return await prisma.clientContact.delete({ where: { id } });
};

export const findClientByEmail = async (email) => {
  return await prisma.client.findFirst({
    where: { email }
  });
};

export const findUserByEmail = async (email) => {
  return await prisma.user.findFirst({
    where: { email, deletedAt: null }
  });
};

export const updateUserStatusByEmail = async (email, status) => {
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null }
  });
  if (user) {
    return await prisma.user.update({
      where: { id: user.id },
      data: { status }
    });
  }
  return null;
};
