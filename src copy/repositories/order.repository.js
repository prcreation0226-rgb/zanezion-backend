import prisma from '../config/db.js';

const generateOrderNumber = async (tenantId) => {
  const lastOrder = await prisma.order.findFirst({
    orderBy: { id: 'desc' }
  });
  const nextNum = lastOrder ? lastOrder.id + 1 : 1;
  return `ORD-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`;
};

export const createOrder = async (data, items, tenantId) => {
  return await prisma.$transaction(async (tx) => {
    const orderNumber = data.orderNumber || await generateOrderNumber(tenantId);
    
    const itemsArray = items || [];
    let computedTotalAmount = itemsArray.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    
    // If no explicit DB items but we have a total amount in data, use it
    if (computedTotalAmount === 0 && (data.totalAmount !== undefined || data.total_amount !== undefined)) {
        computedTotalAmount = Number(data.totalAmount || data.total_amount || 0);
    }

    const validDbKeys = [
      'id',
      'tenantId',
      'orderNumber',
      'clientId',
      'createdById',
      'status',
      'priority',
      'orderType',
      'metadata',
      'totalAmount',
      'createdAt',
      'updatedAt'
    ];

    const dbData = {};
    const metadataExt = {};

    Object.keys(data).forEach(key => {
      if (validDbKeys.includes(key)) {
        dbData[key] = data[key];
      } else {
        metadataExt[key] = data[key];
      }
    });

    const existingMetadata = typeof data.metadata === 'string'
      ? JSON.parse(data.metadata)
      : (data.metadata || {});

    const finalMetadata = {
      ...existingMetadata,
      ...metadataExt
    };

    const newOrder = await tx.order.create({
      data: {
        ...dbData,
        orderNumber,
        tenantId,
        totalAmount: computedTotalAmount,
        metadata: finalMetadata,
        ...(itemsArray.length > 0 && {
          items: {
            create: itemsArray.map(item => ({
              ...item,
              tenantId,
              totalPrice: item.quantity * item.unitPrice
            }))
          }
        })
      },
      include: { items: true, client: true }
    });

    const { metadata, ...rest } = newOrder;
    return {
      ...rest,
      metadata: finalMetadata,
      ...finalMetadata
    };
  });
};

export const findOrderById = async (id) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { item: true } },
      client: true,
      creator: { select: { firstName: true, lastName: true } }
    }
  });
  if (!order) return null;
  const { metadata, ...rest } = order;
  const metadataObj = typeof metadata === 'string' ? JSON.parse(metadata) : (metadata || {});
  return {
    ...rest,
    metadata: metadataObj,
    ...metadataObj
  };
};

export const findAllOrders = async (tenantId, query) => {
  const { page = 1, limit = 10, search = '', status, clientId, orderType } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(tenantId !== null && { tenantId }),
    ...(search && { orderNumber: { contains: search } }),
    ...(status && { status }),
    ...(clientId && { clientId: Number(clientId) }),
    ...(orderType && { orderType })
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { item: true } },
        client: { select: { companyName: true, clientCode: true } }
      }
    }),
    prisma.order.count({ where })
  ]);

  const mappedOrders = orders.map(o => {
    const { metadata, ...rest } = o;
    const metadataObj = typeof metadata === 'string' ? JSON.parse(metadata) : (metadata || {});
    return {
      ...rest,
      metadata: metadataObj,
      ...metadataObj
    };
  });

  return { orders: mappedOrders, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

export const updateOrderStatus = async (id, status) => {
  const updatedOrder = await prisma.order.update({
    where: { id },
    data: { status }
  });
  if (!updatedOrder) return null;
  const { metadata, ...rest } = updatedOrder;
  const metadataObj = typeof metadata === 'string' ? JSON.parse(metadata) : (metadata || {});
  return {
    ...rest,
    metadata: metadataObj,
    ...metadataObj
  };
};

export const deleteOrder = async (id) => {
  return await prisma.order.delete({ where: { id } });
};
