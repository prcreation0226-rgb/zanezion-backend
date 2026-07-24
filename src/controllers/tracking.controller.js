import * as trackingService from '../services/tracking.service.js';
import { sendResponse } from '../utils/response.js';

import { resolveTenantId } from '../utils/tenantResolver.js';
export const createTracking = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToUse = isSuperAdmin ? (req.body.tenantId || req.user.tenantId || 1) : (req.user.tenantId || 1);

    const tracking = await trackingService.createTracking(req.body, req.user.id, tenantIdToUse);
    sendResponse(res, 201, 'Asset tracking initiated successfully', tracking);
  } catch (error) {
    next(error);
  }
};

export const getTracking = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const result = await trackingService.getTracking(tenantIdToFilter);
    sendResponse(res, 200, 'Tracking fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const updateTracking = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const tracking = await trackingService.updateTracking(req.params.id, req.body, tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Tracking updated successfully', tracking);
  } catch (error) {
    next(error);
  }
};

export const deleteTracking = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    await trackingService.deleteTracking(req.params.id, tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Tracking deleted successfully', null);
  } catch (error) {
    next(error);
  }
};
