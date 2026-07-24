import prisma from '../config/db.js';

// Tickets
export const createTicket = async (data) => await prisma.supportTicket.create({ data });
export const findAllTickets = async (tenantId) => await prisma.supportTicket.findMany({ where: { ...(tenantId !== null && { tenantId }) }, orderBy: { createdAt: 'desc' } });
export const findTicketById = async (ticketId, tenantId) => {
  if (tenantId === null) return await prisma.supportTicket.findFirst({ where: { ticketId } });
  return await prisma.supportTicket.findUnique({ where: { ticketId_tenantId: { ticketId, tenantId } } });
};
export const updateTicket = async (ticketId, tenantId, data) => {
  if (tenantId === null) {
    const existing = await prisma.supportTicket.findFirst({ where: { ticketId } });
    if (!existing) return null;
    return await prisma.supportTicket.update({ where: { id: existing.id }, data });
  }
  return await prisma.supportTicket.update({ where: { ticketId_tenantId: { ticketId, tenantId } }, data });
};
export const deleteTicket = async (ticketId, tenantId) => {
  if (tenantId === null) {
    const existing = await prisma.supportTicket.findFirst({ where: { ticketId } });
    if (!existing) return null;
    return await prisma.supportTicket.delete({ where: { id: existing.id } });
  }
  return await prisma.supportTicket.delete({ where: { ticketId_tenantId: { ticketId, tenantId } } });
};

// Events
export const createEvent = async (data) => await prisma.event.create({ data });
export const findAllEvents = async (tenantId) => await prisma.event.findMany({
  where: { ...(tenantId !== null && { tenantId }) },
  include: {
    client: { select: { id: true, companyName: true, contactPerson: true } },
    manager: { select: { id: true, name: true } }
  },
  orderBy: { createdAt: 'desc' }
});
export const findEventById = async (eventId, tenantId) => {
  if (tenantId === null) return await prisma.event.findFirst({ where: { eventId } });
  return await prisma.event.findUnique({ where: { eventId_tenantId: { eventId, tenantId } } });
};
export const updateEvent = async (eventId, tenantId, data) => {
  if (tenantId === null) {
    const existing = await prisma.event.findFirst({ where: { eventId } });
    if (!existing) return null;
    return await prisma.event.update({ where: { id: existing.id }, data });
  }
  return await prisma.event.update({ where: { eventId_tenantId: { eventId, tenantId } }, data });
};
export const deleteEvent = async (eventId, tenantId) => {
  if (tenantId === null) {
    const existing = await prisma.event.findFirst({ where: { eventId } });
    if (!existing) return null;
    return await prisma.event.delete({ where: { id: existing.id } });
  }
  return await prisma.event.delete({ where: { eventId_tenantId: { eventId, tenantId } } });
};

// Guest Requests
const mapGuestRequest = (req) => {
  if (!req) return req;
  const { metadata, ...rest } = req;
  const metadataObj = typeof metadata === 'string' ? JSON.parse(metadata) : (metadata || {});
  return { ...rest, ...metadataObj, metadata: metadataObj };
};

export const createGuestRequest = async (data) => {
  const validDbKeys = ['requestId', 'guestName', 'room', 'requestType', 'status', 'tenantId'];
  const dbData = {};
  const metadataExt = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined) {
      if (validDbKeys.includes(key)) {
        dbData[key] = data[key];
      } else {
        metadataExt[key] = data[key];
      }
    }
  });

  const req = await prisma.guestRequest.create({ data: { ...dbData, metadata: metadataExt } });
  return mapGuestRequest(req);
};

export const findAllGuestRequests = async (tenantId) => {
  const reqs = await prisma.guestRequest.findMany({ where: { ...(tenantId !== null && { tenantId }) }, orderBy: { createdAt: 'desc' } });
  return reqs.map(mapGuestRequest);
};

export const findGuestRequestById = async (requestId, tenantId) => {
  let req;
  if (tenantId === null) {
    req = await prisma.guestRequest.findFirst({ where: { requestId } });
  } else {
    req = await prisma.guestRequest.findUnique({ where: { requestId_tenantId: { requestId, tenantId } } });
  }
  return mapGuestRequest(req);
};

export const updateGuestRequest = async (requestId, tenantId, data) => {
  const existing = await findGuestRequestById(requestId, tenantId);
  if (!existing) return null;

  const validDbKeys = ['guestName', 'room', 'requestType', 'status', 'tenantId'];
  const dbData = {};
  const metadataExt = {};
  Object.keys(data).forEach(key => {
    if (validDbKeys.includes(key)) {
      dbData[key] = data[key];
    } else {
      metadataExt[key] = data[key];
    }
  });

  const finalMetadata = {
    ...(existing.metadata || {}),
    ...metadataExt
  };

  const req = await prisma.guestRequest.update({ where: { id: existing.id }, data: { ...dbData, metadata: finalMetadata } });
  return mapGuestRequest(req);
};

export const deleteGuestRequest = async (requestId, tenantId) => {
  if (tenantId === null) {
    const existing = await prisma.guestRequest.findFirst({ where: { requestId } });
    if (!existing) return null;
    return await prisma.guestRequest.delete({ where: { id: existing.id } });
  }
  return await prisma.guestRequest.delete({ where: { requestId_tenantId: { requestId, tenantId } } });
};
