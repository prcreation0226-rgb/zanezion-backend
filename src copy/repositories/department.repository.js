import prisma from '../config/db.js';

export const createDepartment = async (data) => {
  return await prisma.department.create({ data });
};

export const findDepartmentById = async (id) => {
  return await prisma.department.findUnique({
    where: { id },
    include: { tenant: true }
  });
};

export const findDepartmentByCodeAndTenant = async (code, tenantId) => {
  return await prisma.department.findFirst({
    where: { 
      code, 
      ...(tenantId !== null && { tenantId }) 
    }
  });
};

export const findAllDepartments = async (tenantId, query) => {
  const { page = 1, limit = 10, search = '', status } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(tenantId !== null && { tenantId }),
    ...(search && {
      OR: [
        { name: { contains: search } },
        { code: { contains: search } }
      ]
    }),
    ...(status && { status })
  };

  const [departments, total] = await Promise.all([
    prisma.department.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { employees: true } }
      }
    }),
    prisma.department.count({ where })
  ]);

  return { departments, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

export const updateDepartment = async (id, data) => {
  return await prisma.department.update({
    where: { id },
    data
  });
};

export const deleteDepartment = async (id) => {
  return await prisma.department.delete({ where: { id } });
};
