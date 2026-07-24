import * as routeService from '../services/route.service.js';
import { sendResponse } from '../utils/response.js';

import { resolveTenantId } from '../utils/tenantResolver.js';
export const createRoute = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToUse = isSuperAdmin ? (req.body.tenantId || req.user.tenantId || 1) : (req.user.tenantId || 1);

    const route = await routeService.createRoute(req.body, req.user.id, tenantIdToUse);
    sendResponse(res, 201, 'Supply route established successfully', route);
  } catch (error) {
    next(error);
  }
};

export const getRoutes = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const result = await routeService.getRoutes(tenantIdToFilter);
    sendResponse(res, 200, 'Routes fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const updateRoute = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const route = await routeService.updateRoute(req.params.id, req.body, tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Supply route updated successfully', route);
  } catch (error) {
    next(error);
  }
};

export const deleteRoute = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    await routeService.deleteRoute(req.params.id, tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Supply route disabled successfully', null);
  } catch (error) {
    next(error);
  }
};
