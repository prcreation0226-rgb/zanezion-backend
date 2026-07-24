import * as supportRepository from '../repositories/support.repository.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';

const generateId = (prefix) => `${prefix}-${Math.floor(1000 + Math.random() * 8999)}`;

// Tickets
export const createTicket = async (data, performerId, tenantId) => {
  let ticketId = data.id || generateId('TKT');
  const existing = await supportRepository.findTicketById(ticketId, tenantId);
  if (existing) throw new AppError('Ticket ID already exists', 400);

  const payload = {
    ticketId,
    title: data.subject || data.title || data.issue || 'Support Request',
    description: data.description || '',
    priority: data.priority || 'Medium',
    status: data.status || 'Open',
    category: data.category || 'General',
    clientId: (() => {
      const cid = data.client_id || data.clientId;
      if (!cid) return null;
      const parsed = parseInt(String(cid).replace(/\D/g, ''), 10);
      return isNaN(parsed) ? null : parsed;
    })(),
    managerId: data.manager_id ? Number(data.manager_id) : (data.managerId ? Number(data.managerId) : null),
    createdById: data.created_by ? Number(data.created_by) : (data.createdById ? Number(data.createdById) : null),
    createdByEmail: data.createdByEmail || null,
    createdByName: data.createdByName || null,
    messages: data.messages ? JSON.parse(JSON.stringify(data.messages)) : [],
    tenantId
  };

  const ticket = await supportRepository.createTicket(payload);
  await logAudit({ module: 'SUPPORT', action: 'CREATE', description: `Logged ticket ${ticket.ticketId}`, newValue: ticket, performedBy: performerId });
  return { ...ticket, id: ticket.ticketId };
};

export const getTickets = async (tenantId) => {
  const tickets = await supportRepository.findAllTickets(tenantId);
  return tickets.map(t => ({ ...t, id: t.ticketId }));
};

export const updateTicket = async (id, data, tenantId, performerId) => {
  const existing = await supportRepository.findTicketById(id, tenantId);
  if (!existing) throw new AppError('Ticket not found', 404);

  const payload = {
    title: data.title !== undefined ? data.title : existing.title,
    description: data.description !== undefined ? data.description : existing.description,
    priority: data.priority !== undefined ? data.priority : existing.priority,
    status: data.status !== undefined ? data.status : existing.status,
    category: data.category !== undefined ? data.category : existing.category,
    messages: data.messages !== undefined ? JSON.parse(JSON.stringify(data.messages)) : existing.messages
  };

  const updated = await supportRepository.updateTicket(id, tenantId, payload);
  await logAudit({ module: 'SUPPORT', action: 'UPDATE', description: `Updated ticket ${id}`, oldValue: existing, newValue: updated, performedBy: performerId });
  return { ...updated, id: updated.ticketId };
};

export const deleteTicket = async (id, tenantId, performerId) => {
  const existing = await supportRepository.findTicketById(id, tenantId);
  if (!existing) throw new AppError('Ticket not found', 404);
  await supportRepository.deleteTicket(id, tenantId);
  await logAudit({ module: 'SUPPORT', action: 'DELETE', description: `Deleted ticket ${id}`, oldValue: existing, performedBy: performerId });
  return true;
};

// Events
export const createEvent = async (data, performerId, tenantId) => {
  let eventId = data.id || generateId('EVT');
  const existing = await supportRepository.findEventById(eventId, tenantId);
  if (existing) throw new AppError('Event ID already exists', 400);

  const payload = {
    eventId,
    name: data.name || data.title || 'Support Event',
    date: data.date || data.event_date || '',
    location: data.location || '',
    status: data.status || 'Scheduled',
    clientId: data.client_id ? Number(data.client_id) : null,
    managerId: data.manager_id ? Number(data.manager_id) : null,
    specialRequests: data.special_requests || '',
    plannerName: data.planner_name || '',
    guestCount: data.guest_count ? Number(data.guest_count) : null,
    moodBoardUrl: data.mood_board_url || '',
    tenantId
  };

  const event = await supportRepository.createEvent(payload);
  return { ...event, id: event.eventId };
};

export const getEvents = async (tenantId) => {
  const events = await supportRepository.findAllEvents(tenantId);
  return events.map(e => ({ ...e, id: e.eventId }));
};

export const updateEvent = async (id, data, tenantId, performerId) => {
  const existing = await supportRepository.findEventById(id, tenantId);
  if (!existing) throw new AppError('Event not found', 404);

  const payload = {
    name: data.name !== undefined ? data.name : (data.title !== undefined ? data.title : existing.name),
    date: data.date !== undefined ? data.date : (data.event_date !== undefined ? data.event_date : existing.date),
    location: data.location !== undefined ? data.location : existing.location,
    status: data.status !== undefined ? data.status : existing.status,
    clientId: data.client_id !== undefined ? (data.client_id ? Number(data.client_id) : null) : existing.clientId,
    managerId: data.manager_id !== undefined ? (data.manager_id ? Number(data.manager_id) : null) : existing.managerId,
    specialRequests: data.special_requests !== undefined ? data.special_requests : existing.specialRequests,
    plannerName: data.planner_name !== undefined ? data.planner_name : existing.plannerName,
    guestCount: data.guest_count !== undefined ? (data.guest_count ? Number(data.guest_count) : null) : existing.guestCount,
    moodBoardUrl: data.mood_board_url !== undefined ? data.mood_board_url : existing.moodBoardUrl
  };

  const updated = await supportRepository.updateEvent(id, tenantId, payload);
  return { ...updated, id: updated.eventId };
};

export const deleteEvent = async (id, tenantId, performerId) => {
  const existing = await supportRepository.findEventById(id, tenantId);
  if (!existing) throw new AppError('Event not found', 404);
  await supportRepository.deleteEvent(id, tenantId);
  return true;
};

// Guest Requests
export const createGuestRequest = async (data, performerId, tenantId) => {
  let requestId = data.id || generateId('GRQ');
  const existing = await supportRepository.findGuestRequestById(requestId, tenantId);
  if (existing) throw new AppError('Guest Request ID already exists', 400);

  const payload = {
    ...data,
    requestId,
    guestName: data.guestName || data.guest || data.name || 'Guest',
    room: data.room || '',
    requestType: data.requestType || data.type || 'General',
    status: data.status || 'Pending',
    created_by: performerId,
    tenantId
  };

  const req = await supportRepository.createGuestRequest(payload);
  return { ...req, id: req.requestId };
};

export const getGuestRequests = async (tenantId) => {
  const reqs = await supportRepository.findAllGuestRequests(tenantId);
  return reqs.map(r => ({ ...r, id: r.requestId }));
};

export const updateGuestRequest = async (id, data, tenantId, performerId) => {
  const existing = await supportRepository.findGuestRequestById(id, tenantId);
  if (!existing) throw new AppError('Guest Request not found', 404);
  
  if (data.guest && !data.guestName) data.guestName = data.guest;

  const updated = await supportRepository.updateGuestRequest(id, tenantId, data);
  return { ...updated, id: updated.requestId };
};

export const deleteGuestRequest = async (id, tenantId, performerId) => {
  const existing = await supportRepository.findGuestRequestById(id, tenantId);
  if (!existing) throw new AppError('Guest Request not found', 404);
  await supportRepository.deleteGuestRequest(id, tenantId);
  return true;
};
