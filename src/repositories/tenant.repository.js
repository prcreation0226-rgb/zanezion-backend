import prisma from '../config/db.js';

export const createTenant = async (data) => {
  return await prisma.tenant.create({ data });
};

export const findTenantById = async (id) => {
  return await prisma.tenant.findUnique({
    where: { id },
    include: { organization: true, activeSubscription: { include: { plan: true } } }
  });
};

export const findTenantByCode = async (tenantCode) => {
  return await prisma.tenant.findUnique({ where: { tenantCode } });
};

export const findAllTenants = async (query) => {
  const { page = 1, limit = 10, search = '', organizationId, status } = query;
  const skip = (page - 1) * limit;

  const where = {
    tenantCode: { contains: search }
  };
  
  if (organizationId) {
    where.organizationId = Number(organizationId);
  }
  
  if (status) {
    where.status = status;
  }

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      include: { organization: true, activeSubscription: { include: { plan: true } } },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.tenant.count({ where })
  ]);

  return { tenants, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

export const updateTenant = async (id, data) => {
  return await prisma.tenant.update({
    where: { id },
    data
  });
};

export const deleteTenant = async (id) => {
  return await prisma.tenant.delete({ where: { id } });
};
