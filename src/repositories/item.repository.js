import prisma from '../config/db.js';

export const createItem = async (data) => {
  return await prisma.item.create({
    data,
    include: { category: true, unit: true }
  });
};

export const findItemById = async (id) => {
  return await prisma.item.findUnique({
    where: { id },
    include: { category: true, unit: true }
  });
};

export const findItemBySku = async (sku, tenantId) => {
  return await prisma.item.findFirst({
    where: { sku, tenantId }
  });
};

export const findAllItems = async (tenantId, query) => {
  const { page = 1, limit = 10, search = '', status, categoryId, clientId } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(tenantId !== null && (Array.isArray(tenantId) ? { tenantId: { in: tenantId.map(Number) } } : { tenantId: Number(tenantId) })),
    ...(search && {
      OR: [
        { name: { contains: search } },
        { sku: { contains: search } }
      ]
    }),
    ...(status && { status }),
    ...(categoryId && { categoryId: Number(categoryId) }),
    ...(clientId && { clientId: Number(clientId) })
  };

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { name: true } },
        unit: { select: { name: true, shortName: true } },
        inventoryStock: { select: { quantity: true, warehouseId: true } }
      }
    }),
    prisma.item.count({ where })
  ]);

  return { items, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

export const updateItem = async (id, data) => {
  return await prisma.item.update({
    where: { id },
    data,
    include: { category: true, unit: true }
  });
};

export const deleteItem = async (id) => {
  return await prisma.$transaction([
    prisma.inventoryStock.deleteMany({ where: { itemId: id } }),
    prisma.stockMovement.deleteMany({ where: { itemId: id } }),
    prisma.lossAssessment.deleteMany({ where: { itemId: id } }),
    prisma.deliveryItem.deleteMany({ where: { itemId: id } }),
    prisma.orderItem.deleteMany({ where: { itemId: id } }),
    prisma.invoiceItem.deleteMany({ where: { itemId: id } }),
    prisma.gRNItem.deleteMany({ where: { itemId: id } }),
    prisma.item.delete({ where: { id } })
  ]);
};
