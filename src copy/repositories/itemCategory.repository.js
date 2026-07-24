import prisma from '../config/db.js';

export const createItemCategory = async (data) => {
  return await prisma.itemCategory.create({ data });
};

export const findItemCategoryById = async (id) => {
  return await prisma.itemCategory.findUnique({ where: { id } });
};

export const findAllItemCategories = async (tenantId, query) => {
  const { page = 1, limit = 10, search = '', status } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(tenantId !== null && { tenantId }),
    ...(search && { name: { contains: search } }),
    ...(status && { status })
  };

  const [categories, total] = await Promise.all([
    prisma.itemCategory.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.itemCategory.count({ where })
  ]);

  return { categories, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

export const updateItemCategory = async (id, data) => {
  return await prisma.itemCategory.update({
    where: { id },
    data
  });
};

export const deleteItemCategory = async (id) => {
  return await prisma.itemCategory.delete({ where: { id } });
};
