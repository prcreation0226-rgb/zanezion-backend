import prisma from '../config/db.js';

export const createPlan = async (data) => {
  return await prisma.plan.create({ data });
};

export const findPlanById = async (id) => {
  return await prisma.plan.findUnique({ where: { id: Number(id) } });
};

export const findAllPlans = async (query) => {
  const { page = 1, limit = 10, search = '', isActive } = query;
  const skip = (page - 1) * limit;
  
  const where = {
    ...(search && { name: { contains: search } })
  };
  
  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  const [plans, total] = await Promise.all([
    prisma.plan.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { price: 'asc' }
    }),
    prisma.plan.count({ where })
  ]);

  return { plans, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

export const updatePlan = async (id, data) => {
  return await prisma.plan.update({
    where: { id: Number(id) },
    data
  });
};

export const deletePlan = async (id) => {
  const numericId = Number(id);
  
  try {
    const subs = await prisma.subscription.findMany({
      where: { planId: numericId },
      select: { id: true }
    });
    const subIds = subs.map(s => s.id);
    if (subIds.length > 0) {
      await prisma.tenant.updateMany({
        where: { subscriptionId: { in: subIds } },
        data: { subscriptionId: null }
      });
      await prisma.subscription.deleteMany({
        where: { planId: numericId }
      });
    }
    return await prisma.plan.delete({ where: { id: numericId } });
  } catch (err) {
    console.warn('Standard plan delete failed, running force raw SQL cleanup & delete:', err.message);
    await prisma.$executeRawUnsafe(
      `UPDATE "tenants" SET "subscriptionId" = NULL WHERE "subscriptionId" IN (SELECT "id" FROM "subscriptions" WHERE "planId" = ${numericId});`
    ).catch(() => {});
    await prisma.$executeRawUnsafe(
      `DELETE FROM "subscriptions" WHERE "planId" = ${numericId};`
    ).catch(() => {});
    await prisma.$executeRawUnsafe(
      `DELETE FROM "plans" WHERE "id" = ${numericId};`
    ).catch(() => {});
    return true;
  }
};
