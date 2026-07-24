import prisma from '../config/db.js';

export const createPermission = async (data) => {
  return await prisma.permission.create({ data });
};

export const findPermissionById = async (id) => {
  return await prisma.permission.findUnique({ where: { id } });
};

export const findPermissionByModuleAndAction = async (module, action) => {
  return await prisma.permission.findFirst({ where: { module, action } });
};

export const findAllPermissions = async (query) => {
  const { page = 1, limit = 10, search = '', module } = query;
  const skip = (page - 1) * limit;

  const where = {
    name: { contains: search },
    ...(module && { module })
  };

  const [permissions, total] = await Promise.all([
    prisma.permission.findMany({
      where,
      skip: Number(skip),
      take: Number(limit)
    }),
    prisma.permission.count({ where })
  ]);

  return { permissions, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

export const updatePermission = async (id, data) => {
  return await prisma.permission.update({
    where: { id },
    data
  });
};

export const deletePermission = async (id) => {
  return await prisma.permission.delete({ where: { id } });
};
