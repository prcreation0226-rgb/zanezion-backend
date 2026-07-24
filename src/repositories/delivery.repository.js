import prisma from '../config/db.js';

const generateDeliveryNumber = async (tenantId) => {
  const lastDelivery = await prisma.delivery.findFirst({
    orderBy: { id: 'desc' }
  });
  const nextNum = lastDelivery ? lastDelivery.id + 1 : 1;
  return `DEL-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`;
};

export const createDelivery = async (data, items, tenantId) => {
  return await prisma.$transaction(async (tx) => {
    const deliveryNumber = await generateDeliveryNumber(tenantId);

    // Parse Date fields if they exist
    const parsedData = { ...data };
    if (parsedData.etaSchedule) parsedData.etaSchedule = new Date(parsedData.etaSchedule);
    if (parsedData.requestDate) parsedData.requestDate = new Date(parsedData.requestDate);
    if (parsedData.dueDate) parsedData.dueDate = new Date(parsedData.dueDate);

    // Filter out undefined items
    const validItems = Array.isArray(items) ? items : [];

    return await tx.delivery.create({
      data: {
        ...parsedData,
        deliveryNumber,
        tenantId,
        items: validItems.length > 0 ? {
          create: validItems.map(item => ({
            ...item,
            tenantId
          }))
        } : undefined
      },
      include: { items: true, client: true, order: true }
    });
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
        assignee: { select: { firstName: true, lastName: true } },
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

  if (status === 'delivered' && updatedDelivery.orderId) {
    await tx.order.update({
      where: { id: updatedDelivery.orderId },
      data: { status: 'completed' }
    });
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

  if (parsedData.status === 'delivered' && updatedDelivery.orderId) {
    await prisma.order.update({
      where: { id: updatedDelivery.orderId },
      data: { status: 'completed' }
    });
  }

  return updatedDelivery;
};
