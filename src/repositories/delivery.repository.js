import prisma from '../config/db.js';

const generateDeliveryNumber = async (tenantId) => {
  const lastDelivery = await prisma.delivery.findFirst({
    orderBy: { id: 'desc' }
  });
  const nextNum = lastDelivery ? lastDelivery.id + 1 : 1;
  return `DEL-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`;
};

export const createDelivery = async (data, items, tenantId, tx = null) => {
  const clientToUse = tx || prisma;
  const resolvedTenantId = (tenantId != null && !isNaN(Number(tenantId))) ? Number(tenantId) : (data.tenantId != null ? Number(data.tenantId) : 1);
  const deliveryNumber = await generateDeliveryNumber(resolvedTenantId);

  // Parse Date fields safely if valid
  const parsedData = { ...data };
  if (parsedData.etaSchedule && !isNaN(new Date(parsedData.etaSchedule).getTime())) {
    parsedData.etaSchedule = new Date(parsedData.etaSchedule);
  } else {
    delete parsedData.etaSchedule;
  }
  if (parsedData.requestDate && !isNaN(new Date(parsedData.requestDate).getTime())) {
    parsedData.requestDate = new Date(parsedData.requestDate);
  } else {
    delete parsedData.requestDate;
  }
  if (parsedData.dueDate && !isNaN(new Date(parsedData.dueDate).getTime())) {
    parsedData.dueDate = new Date(parsedData.dueDate);
  } else {
    delete parsedData.dueDate;
  }

  // Clean non-model fields and relational fields from parsedData
  delete parsedData.items;
  delete parsedData.tenantId;
  delete parsedData.deliveryNumber;

  // Filter out items that cannot be created as DeliveryItem (must have valid integer itemId and orderItemId)
  const validItems = (Array.isArray(items) ? items : []).filter(
    it => it && 
          Number.isInteger(Number(it.itemId)) && Number(it.itemId) > 0 &&
          Number.isInteger(Number(it.orderItemId)) && Number(it.orderItemId) > 0
  );

  return await clientToUse.delivery.create({
    data: {
      ...parsedData,
      deliveryNumber,
      tenantId: resolvedTenantId,
      items: validItems.length > 0 ? {
        create: validItems.map(item => ({
          tenant: { connect: { id: resolvedTenantId } },
          orderItem: { connect: { id: Number(item.orderItemId) } },
          item: { connect: { id: Number(item.itemId) } },
          quantity: Number(item.quantity) || 1
        }))
      } : undefined
    },
    include: { items: true, client: true, order: true }
  });
};

export const findDeliveryById = async (id) => {
  return await prisma.delivery.findUnique({
    where: { id },
    include: {
      items: { include: { item: true, orderItem: true } },
      client: true,
      order: true,
      assignee: { select: { firstName: true, lastName: true } },
      warehouse: { select: { name: true } },
      missions: true,
      proofs: true
    }
  });
};

export const findAllDeliveries = async (tenantId, query) => {
  const { page = 1, limit = 10, search = '', status, warehouseId, assignedTo, clientId } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(tenantId !== null && { tenantId }),
    ...(search && { deliveryNumber: { contains: search } }),
    ...(status && { status }),
    ...(warehouseId && { warehouseId: Number(warehouseId) }),
    ...(assignedTo && { assignedTo: Number(assignedTo) }),
    ...(clientId && { clientId: Number(clientId) })
  };

  const [deliveries, total] = await Promise.all([
    prisma.delivery.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { companyName: true } },
        order: { select: { orderNumber: true } },
        assignee: { select: { firstName: true, lastName: true, userId: true } },
        items: { include: { item: true } },
        proofs: true
      }
    }),
    prisma.delivery.count({ where })
  ]);

  return { deliveries, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

export const updateDeliveryStatus = async (tx, id, status, extraData = {}) => {
  const updatedDelivery = await tx.delivery.update({
    where: { id },
    data: { status, ...extraData }
  });

  if (updatedDelivery.orderId) {
    const norm = String(status || '').toLowerCase().replace(/\s+/g, '_');
    let orderStatus = null;
    if (['delivered', 'completed', 'done'].includes(norm)) {
      orderStatus = 'completed';
    } else if (['in_transit', 'out_for_delivery', 'en_route', 'dispatched'].includes(norm)) {
      orderStatus = 'in_transit';
    } else if (['assigned', 'accepted'].includes(norm)) {
      orderStatus = 'assigned';
    } else if (['cancelled', 'rejected', 'failed'].includes(norm)) {
      orderStatus = 'cancelled';
    }
    if (orderStatus) {
      try {
        await tx.order.update({
          where: { id: updatedDelivery.orderId },
          data: { status: orderStatus }
        });
      } catch (_) {}
    }
  }

  return updatedDelivery;
};

// Internal method for validation
export const getDeliveredQuantityForOrderItem = async (orderItemId) => {
  const items = await prisma.deliveryItem.findMany({
    where: { orderItemId, delivery: { status: { not: 'cancelled' } } }
  });
  return items.reduce((sum, item) => sum + item.quantity, 0);
};

export const updateDelivery = async (id, data) => {
  // Parse Date fields if they exist
  const parsedData = { ...data };
  if (parsedData.etaSchedule) parsedData.etaSchedule = new Date(parsedData.etaSchedule);
  if (parsedData.requestDate) parsedData.requestDate = new Date(parsedData.requestDate);
  if (parsedData.dueDate) parsedData.dueDate = new Date(parsedData.dueDate);

  // Exclude fields that shouldn't be updated directly via this generic method
  delete parsedData.items;
  delete parsedData.deliveryNumber;
  delete parsedData.tenantId;

  const updatedDelivery = await prisma.delivery.update({
    where: { id },
    data: parsedData,
    include: { items: true, client: true, order: true }
  });

  if (updatedDelivery.orderId && parsedData.status) {
    const norm = String(parsedData.status || '').toLowerCase().replace(/\s+/g, '_');
    let orderStatus = null;
    if (['delivered', 'completed', 'done'].includes(norm)) {
      orderStatus = 'completed';
    } else if (['in_transit', 'out_for_delivery', 'en_route', 'dispatched'].includes(norm)) {
      orderStatus = 'in_transit';
    } else if (['assigned', 'accepted'].includes(norm)) {
      orderStatus = 'assigned';
    } else if (['cancelled', 'rejected', 'failed'].includes(norm)) {
      orderStatus = 'cancelled';
    }
    if (orderStatus) {
      try {
        await prisma.order.update({
          where: { id: updatedDelivery.orderId },
          data: { status: orderStatus }
        });
      } catch (_) {}
    }
  }

  return updatedDelivery;
};
