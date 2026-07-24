import prisma from '../config/db.js';

export const createRoute = async (data) => {
  return await prisma.supplyRoute.create({ data });
};

export const findRouteByRouteId = async (routeId, tenantId) => {
  if (tenantId === null) {
    return await prisma.supplyRoute.findFirst({ where: { routeId } });
  }
  return await prisma.supplyRoute.findUnique({
    where: { routeId_tenantId: { routeId, tenantId } }
  });
};

export const findAllRoutes = async (tenantId) => {
  return await prisma.supplyRoute.findMany({
    where: { ...(tenantId !== null && { tenantId }) },
    orderBy: { createdAt: 'desc' }
  });
};

export const updateRoute = async (routeId, tenantId, data) => {
  if (tenantId === null) {
    const existing = await prisma.supplyRoute.findFirst({ where: { routeId } });
    if (!existing) return null;
    return await prisma.supplyRoute.update({
      where: { id: existing.id },
      data
    });
  }
  return await prisma.supplyRoute.update({
    where: { routeId_tenantId: { routeId, tenantId } },
    data
  });
};

export const deleteRoute = async (routeId, tenantId) => {
  if (tenantId === null) {
    const existing = await prisma.supplyRoute.findFirst({ where: { routeId } });
    if (!existing) return null;
    return await prisma.supplyRoute.delete({
      where: { id: existing.id }
    });
  }
  return await prisma.supplyRoute.delete({
    where: { routeId_tenantId: { routeId, tenantId } }
  });
};
