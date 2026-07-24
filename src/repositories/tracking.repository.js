import prisma from '../config/db.js';

export const createTracking = async (data) => {
  return await prisma.tracking.create({ data });
};

export const findTrackingByTrackerId = async (trackerId, tenantId) => {
  if (tenantId === null) {
    return await prisma.tracking.findFirst({ where: { trackerId } });
  }
  return await prisma.tracking.findUnique({
    where: { trackerId_tenantId: { trackerId, tenantId } }
  });
};

export const findAllTracking = async (tenantId) => {
  return await prisma.tracking.findMany({
    where: { ...(tenantId !== null && { tenantId }) },
    orderBy: { createdAt: 'desc' }
  });
};

export const updateTracking = async (trackerId, tenantId, data) => {
  if (tenantId === null) {
    const existing = await prisma.tracking.findFirst({ where: { trackerId } });
    if (!existing) return null;
    return await prisma.tracking.update({
      where: { id: existing.id },
      data
    });
  }
  return await prisma.tracking.update({
    where: { trackerId_tenantId: { trackerId, tenantId } },
    data
  });
};

export const deleteTracking = async (trackerId, tenantId) => {
  if (tenantId === null) {
    const existing = await prisma.tracking.findFirst({ where: { trackerId } });
    if (!existing) return null;
    return await prisma.tracking.delete({
      where: { id: existing.id }
    });
  }
  return await prisma.tracking.delete({
    where: { trackerId_tenantId: { trackerId, tenantId } }
  });
};
