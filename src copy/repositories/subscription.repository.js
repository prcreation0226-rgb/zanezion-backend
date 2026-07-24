import prisma from '../config/db.js';

export const createSubscription = async (data) => {
  return await prisma.subscription.create({
    data,
    include: { plan: true, tenant: true }
  });
};

export const findSubscriptionById = async (id) => {
  return await prisma.subscription.findUnique({
    where: { id },
    include: { plan: true, tenant: true }
  });
};

export const findActiveSubscriptionByTenantId = async (tenantId) => {
  return await prisma.subscription.findFirst({
    where: { tenantId, status: 'ACTIVE' },
    include: { plan: true }
  });
};

export const findAllSubscriptions = async (query) => {
  const { page = 1, limit = 10, tenantId, status } = query;
  const skip = (page - 1) * limit;
  
  const where = {
    ...(tenantId && { tenantId: Number(tenantId) }),
    ...(status && { status })
  };

  const [subscriptions, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      include: { plan: true, tenant: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.subscription.count({ where })
  ]);

  return { subscriptions, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

export const updateSubscription = async (id, data) => {
  return await prisma.subscription.update({
    where: { id },
    data,
    include: { plan: true, tenant: true }
  });
};
