import * as warehouseService from '../services/warehouse.service.js';
import { sendResponse } from '../utils/response.js';
import prisma from '../config/db.js';
import { resolveTenantId } from '../utils/tenantResolver.js';

export const createWarehouse = async (req, res, next) => {
  try {
    const tenantIdToUse = req.body.tenantId ? Number(req.body.tenantId) : resolveTenantId(req);

    const payload = req.body;

    // Map only valid Prisma schema fields
    const warehouseData = {
      name: payload.name,
      location: payload.location || null,
      capacity: payload.capacity !== undefined ? Number(payload.capacity) : 0,
      status: payload.status || 'active',
      managerId: payload.managerId || payload.manager_id || null,
    };

    const warehouse = await warehouseService.createWarehouse(warehouseData, req.user.id, tenantIdToUse);
    sendResponse(res, 201, 'Warehouse created successfully', warehouse);
  } catch (error) {
    next(error);
  }
};

const checkIsClient = (user) => {
  const roleName = String(user?.role?.name || user?.role || '').toUpperCase();
  if (roleName === 'SAAS_CLIENT') return false;
  return roleName.includes('CLIENT') || roleName.includes('CUSTOMER');
};

export const getWarehouses = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const isClient = checkIsClient(req.user);
    const isSaaSTenant = req.user.tenantId && Number(req.user.tenantId) !== 1;
    const tenantIdToFilter = isSuperAdmin && !req.query.tenantId ? null :
                             isClient ? [1, req.user.tenantId] :
                             isSaaSTenant ? Number(req.user.tenantId) :
                             (req.query.tenantId ? Number(req.query.tenantId) : req.user.tenantId);

    const result = await warehouseService.getWarehouses(tenantIdToFilter, req.query);
    sendResponse(res, 200, 'Warehouses fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getWarehouseById = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const isClient = checkIsClient(req.user);
    const isSaaSTenant = req.user.tenantId && Number(req.user.tenantId) !== 1;
    const tenantIdToFilter = isSuperAdmin ? null :
                             isClient ? [1, req.user.tenantId] :
                             isSaaSTenant ? Number(req.user.tenantId) :
                             (req.user.tenantId || 1);

    const warehouse = await warehouseService.getWarehouseById(Number(req.params.id), tenantIdToFilter);
    sendResponse(res, 200, 'Warehouse fetched successfully', warehouse);
  } catch (error) {
    next(error);
  }
};

export const updateWarehouse = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const payload = req.body;

    // Map only valid Prisma schema fields
    const warehouseData = {};
    if (payload.name !== undefined) warehouseData.name = payload.name;
    if (payload.location !== undefined) warehouseData.location = payload.location;
    if (payload.capacity !== undefined) warehouseData.capacity = Number(payload.capacity);
    if (payload.status !== undefined) warehouseData.status = payload.status;
    
    const providedManagerUserId = payload.managerId ?? payload.manager_id ?? undefined;
    if (providedManagerUserId !== undefined) {
      warehouseData.managerId = providedManagerUserId ? Number(providedManagerUserId) : null;
    }

    const updatedWarehouse = await warehouseService.updateWarehouse(Number(req.params.id), warehouseData, tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Warehouse updated successfully', updatedWarehouse);
  } catch (error) {
    next(error);
  }
};

export const deleteWarehouse = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    await warehouseService.deleteWarehouse(Number(req.params.id), tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Warehouse deleted successfully');
  } catch (error) {
    next(error);
  }
};
