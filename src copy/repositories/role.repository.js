import prisma from '../config/db.js';

export const createRole = async (data) => {
  return await prisma.role.create({ data });
};

export const findRoleByName = async (name) => {
  return await prisma.role.findUnique({ where: { name } });
};

export const findRoleById = async (id) => {
  return await prisma.role.findUnique({ 
    where: { id },
    include: { rolePermissions: { include: { permission: true } } }
  });
};

export const findAllRoles = async (query) => {
  const { page = 1, limit = 10, search = '' } = query;
  const skip = (page - 1) * limit;

  const where = {
    name: { contains: search }
  };

  const [roles, total] = await Promise.all([
    prisma.role.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      include: {
        _count: { select: { users: true } }
      }
    }),
    prisma.role.count({ where })
  ]);

  return { roles, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

export const updateRole = async (id, data) => {
  return await prisma.role.update({
    where: { id },
    data
  });
};

export const deleteRole = async (id) => {
  return await prisma.role.delete({ where: { id } });
};

export const assignPermissionsToRole = async (roleId, permissionIds) => {
  const data = permissionIds.map(permissionId => ({
    roleId,
    permissionId
  }));
  return await prisma.rolePermission.createMany({
    data,
    skipDuplicates: true
  });
};

export const removePermissionsFromRole = async (roleId, permissionIds) => {
  return await prisma.rolePermission.deleteMany({
    where: {
      roleId,
      permissionId: { in: permissionIds }
    }
  });
};
