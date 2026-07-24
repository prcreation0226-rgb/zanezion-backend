import prisma from '../config/db.js';

export const createOrganization = async (data) => {
  return await prisma.organization.create({ data });
};

export const findOrganizationById = async (id) => {
  return await prisma.organization.findUnique({
    where: { id },
    include: { tenants: true }
  });
};

export const findOrganizationByEmail = async (email) => {
  return await prisma.organization.findUnique({ where: { email } });
};

export const findAllOrganizations = async (query) => {
  const { page = 1, limit = 10, search = '', status } = query;
  const skip = (page - 1) * limit;

  const where = {
    name: { contains: search }
  };
  
  if (status) {
    where.status = status;
  }

  const [organizations, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.organization.count({ where })
  ]);

  return { organizations, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

export const updateOrganization = async (id, data) => {
  return await prisma.organization.update({
    where: { id },
    data
  });
};
