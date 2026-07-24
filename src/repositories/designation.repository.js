import prisma from '../config/db.js';

export const createDesignation = async (data) => {
  return await prisma.designation.create({ data });
};

export const findDesignationById = async (id) => {
  return await prisma.designation.findUnique({
    where: { id },
    include: { department: true }
  });
};

export const findDesignationByNameAndDepartment = async (name, departmentId, tenantId) => {
  return await prisma.designation.findFirst({
    where: { 
      name, 
      departmentId,
      ...(tenantId !== null && { tenantId })
    }
  });
};

export const findAllDesignations = async (tenantId, query) => {
  const { page = 1, limit = 10, search = '', departmentId, status } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(tenantId !== null && { tenantId }),
    ...(search && { name: { contains: search } }),
    ...(departmentId && { departmentId: Number(departmentId) }),
    ...(status && { status })
  };

  const [designations, total] = await Promise.all([
    prisma.designation.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: { department: true, _count: { select: { employees: true } } }
    }),
    prisma.designation.count({ where })
  ]);

  return { designations, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

export const updateDesignation = async (id, data) => {
  return await prisma.designation.update({
    where: { id },
    data
  });
};

export const deleteDesignation = async (id) => {
  return await prisma.designation.delete({ where: { id } });
};
