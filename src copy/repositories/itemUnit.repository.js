import prisma from '../config/db.js';

export const createItemUnit = async (data) => {
  return await prisma.itemUnit.create({ data });
};

export const findItemUnitById = async (id) => {
  return await prisma.itemUnit.findUnique({ where: { id } });
};

export const findAllItemUnits = async (tenantId, query) => {
  const { page = 1, limit = 10, search = '', status } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(tenantId !== null && { tenantId }),
    ...(search && {
      OR: [
        { name: { contains: search } },
        { shortName: { contains: search } }
      ]
    }),
    ...(status && { status })
  };

  const [units, total] = await Promise.all([
    prisma.itemUnit.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.itemUnit.count({ where })
  ]);

  return { units, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

export const updateItemUnit = async (id, data) => {
  return await prisma.itemUnit.update({
    where: { id },
    data
  });
};

export const deleteItemUnit = async (id) => {
  return await prisma.itemUnit.delete({ where: { id } });
};
