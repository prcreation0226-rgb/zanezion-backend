import prisma from '../config/db.js';

export const createUrgentAlert = async (data) => {
  return await prisma.urgentAlert.create({ data });
};

export const findAlertByAlertId = async (alertId, tenantId) => {
  if (tenantId === null) {
    return await prisma.urgentAlert.findFirst({ where: { alertId } });
  }
  return await prisma.urgentAlert.findUnique({
    where: { alertId_tenantId: { alertId, tenantId } }
  });
};

export const findAllAlerts = async (tenantId) => {
  return await prisma.urgentAlert.findMany({
    where: { ...(tenantId !== null && { tenantId }) },
    orderBy: { createdAt: 'desc' }
  });
};

export const updateAlert = async (alertId, tenantId, data) => {
  if (tenantId === null) {
    const existing = await prisma.urgentAlert.findFirst({ where: { alertId } });
    if (!existing) return null;
    return await prisma.urgentAlert.update({
      where: { id: existing.id },
      data
    });
  }
  return await prisma.urgentAlert.update({
    where: { alertId_tenantId: { alertId, tenantId } },
    data
  });
};

export const deleteAlert = async (alertId, tenantId) => {
  if (tenantId === null) {
    const existing = await prisma.urgentAlert.findFirst({ where: { alertId } });
    if (!existing) return null;
    return await prisma.urgentAlert.delete({
      where: { id: existing.id }
    });
  }
  return await prisma.urgentAlert.delete({
    where: { alertId_tenantId: { alertId, tenantId } }
  });
};
