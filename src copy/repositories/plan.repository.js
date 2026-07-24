import prisma from '../config/db.js';

export const createPlan = async (data) => {
  return await prisma.plan.create({ data });
};

export const findPlanById = async (id) => {
  return await prisma.plan.findUnique({ where: { id } });
};

export const findAllPlans = async (query) => {
  const { page = 1, limit = 10, search = '', isActive } = query;
  const skip = (page - 1) * limit;
  
  const where = {
    name: { contains: search }
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
    where: { id },
    data
  });
};

export const deletePlan = async (id) => {
  return await prisma.plan.delete({ where: { id } });
};
