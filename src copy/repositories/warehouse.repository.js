import prisma from '../config/db.js';

export const createWarehouse = async (data) => {
  return await prisma.warehouse.create({
    data,
    include: { manager: { select: { id: true, firstName: true, lastName: true, userId: true } } }
  });
};

export const findWarehouseById = async (id) => {
  return await prisma.warehouse.findUnique({
    where: { id },
    include: { manager: { select: { id: true, firstName: true, lastName: true, employeeCode: true, userId: true } } }
  });
};

export const findAllWarehouses = async (tenantId, query) => {
  const { page = 1, limit = 10, search = '', status, managerId } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(tenantId !== null && { tenantId }),
    ...(search && { name: { contains: search } }),
    ...(status && { status }),
    ...(managerId && { managerId: Number(managerId) })
  };

  const [warehouses, total] = await Promise.all([
    prisma.warehouse.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true, userId: true } },
        _count: { select: { inventoryStock: true } }
      }
    }),
    prisma.warehouse.count({ where })
  ]);

  return { warehouses, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

export const updateWarehouse = async (id, data) => {
  return await prisma.warehouse.update({
    where: { id },
    data,
    include: { manager: { select: { id: true, firstName: true, lastName: true, userId: true } } }
  });
};

export const deleteWarehouse = async (id) => {
  return await prisma.warehouse.delete({ where: { id } });
};
