import prisma from '../config/db.js';

export const createSecurityEvent = async (data, tenantId, reporterName) => {
  return await prisma.securityEvent.create({
    data: {
      eventType: data.eventType,
      details: data.details,
      location: data.location,
      reporter: reporterName,
      tenantId: tenantId
    }
  });
};

export const getSecurityEvents = async (tenantId) => {
  return await prisma.securityEvent.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' }
  });
};

export const resolveSecurityEvent = async (id, tenantId) => {
  return await prisma.securityEvent.update({
    where: { id: parseInt(id), tenantId },
    data: { status: 'Resolved' }
  });
};
