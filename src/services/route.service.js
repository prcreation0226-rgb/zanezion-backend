import * as routeRepository from '../repositories/route.repository.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';

export const createRoute = async (data, performerId, tenantId) => {
  // If the user left 'id' blank in the form, generate one automatically.
  let routeId = data.id;
  if (!routeId || String(routeId).trim() === '') {
    routeId = `RTE-${Math.floor(1000 + Math.random() * 8999)}`;
  }

  const existing = await routeRepository.findRouteByRouteId(routeId, tenantId);
  if (existing) {
    throw new AppError('Route ID already exists. Try generating a new one.', 400);
  }

  const payload = {
    routeId: routeId,
    name: data.name || 'Unnamed Route',
    type: data.type || 'Land',
    distance: String(data.dist || ''),
    avgTime: String(data.time || ''),
    status: data.status || 'Active',
    tenantId
  };

  const route = await routeRepository.createRoute(payload);

  await logAudit({
    module: 'ROUTES',
    action: 'CREATE',
    description: `Established new supply route ${route.name}`,
    newValue: route,
    performedBy: performerId
  });

  return { ...route, id: route.routeId, dist: route.distance, time: route.avgTime };
};

export const getRoutes = async (tenantId) => {
  const routes = await routeRepository.findAllRoutes(tenantId);
  return routes.map(r => ({ ...r, id: r.routeId, dist: r.distance, time: r.avgTime }));
};

export const updateRoute = async (id, data, tenantId, performerId) => {
  const existing = await routeRepository.findRouteByRouteId(id, tenantId);
  if (!existing) {
    throw new AppError('Supply Route not found', 404);
  }

  const payload = {
    name: data.name !== undefined ? data.name : existing.name,
    type: data.type !== undefined ? data.type : existing.type,
    distance: data.dist !== undefined ? String(data.dist) : existing.distance,
    avgTime: data.time !== undefined ? String(data.time) : existing.avgTime,
    status: data.status !== undefined ? data.status : existing.status
  };

  const updated = await routeRepository.updateRoute(id, tenantId, payload);

  await logAudit({
    module: 'ROUTES',
    action: 'UPDATE',
    description: `Updated supply route ${updated.name}`,
    oldValue: existing,
    newValue: updated,
    performedBy: performerId
  });

  return { ...updated, id: updated.routeId, dist: updated.distance, time: updated.avgTime };
};

export const deleteRoute = async (id, tenantId, performerId) => {
  const existing = await routeRepository.findRouteByRouteId(id, tenantId);
  if (!existing) {
    throw new AppError('Supply Route not found', 404);
  }

  await routeRepository.deleteRoute(id, tenantId);

  await logAudit({
    module: 'ROUTES',
    action: 'DELETE',
    description: `Deleted supply route ${existing.name}`,
    oldValue: existing,
    performedBy: performerId
  });

  return true;
};
