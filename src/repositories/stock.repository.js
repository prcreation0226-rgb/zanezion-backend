import prisma from '../config/db.js';

export const getStock = async (warehouseId, itemId) => {
  return await prisma.inventoryStock.findUnique({
    where: { warehouseId_itemId: { warehouseId, itemId } }
  });
};

export const upsertStock = async (tx, tenantId, warehouseId, itemId, quantityChange) => {
  const stock = await tx.inventoryStock.findUnique({
    where: { warehouseId_itemId: { warehouseId, itemId } }
  });

  if (stock) {
    return await tx.inventoryStock.update({
      where: { id: stock.id },
      data: { quantity: { increment: quantityChange } }
    });
  } else {
    return await tx.inventoryStock.create({
      data: {
        tenantId,
        warehouseId,
        itemId,
        quantity: quantityChange
      }
    });
  }
};

export const recordMovement = async (tx, data) => {
  return await tx.stockMovement.create({ data });
};

export const findAllStock = async (tenantId, query) => {
  const { page = 1, limit = 10, warehouseId, itemId } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(tenantId !== null && (Array.isArray(tenantId) ? { tenantId: { in: tenantId.map(Number) } } : { tenantId: Number(tenantId) })),
    ...(warehouseId && { warehouseId: Number(warehouseId) }),
    ...(itemId && { itemId: Number(itemId) })
  };

  const [stock, total] = await Promise.all([
    prisma.inventoryStock.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { lastUpdated: 'desc' },
      include: {
        warehouse: { select: { name: true } },
        item: { select: { name: true, sku: true, price: true, description: true, inventoryType: true, clientId: true, reorderLevel: true, category: { select: { name: true } }, unit: { select: { shortName: true } } } }
      }
    }),
    prisma.inventoryStock.count({ where })
  ]);

  return { stock, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

export const findAllMovements = async (tenantId, query) => {
  const { page = 1, limit = 10, warehouseId, itemId, movementType } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(tenantId !== null && (Array.isArray(tenantId) ? { tenantId: { in: tenantId.map(Number) } } : { tenantId: Number(tenantId) })),
    ...(warehouseId && { warehouseId: Number(warehouseId) }),
    ...(itemId && { itemId: Number(itemId) }),
    ...(movementType && { movementType })
  };

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        warehouse: { select: { name: true } },
        item: { select: { name: true, sku: true } },
        grn: { select: { grnNumber: true } }
      }
    }),
    prisma.stockMovement.count({ where })
  ]);

  return { movements, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};
