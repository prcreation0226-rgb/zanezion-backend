import * as urgentService from '../services/urgent.service.js';
import { sendResponse } from '../utils/response.js';

import { resolveTenantId } from '../utils/tenantResolver.js';
export const createAlert = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToUse = isSuperAdmin ? (req.body.tenantId || req.user.tenantId || 1) : (req.user.tenantId || 1);

    const alert = await urgentService.createAlert(req.body, req.user.id, tenantIdToUse);
    sendResponse(res, 201, 'Urgent alert logged successfully', alert);
  } catch (error) {
    next(error);
  }
};

export const getAlerts = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const result = await urgentService.getAlerts(tenantIdToFilter);
    sendResponse(res, 200, 'Alerts fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const updateAlert = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const alert = await urgentService.updateAlert(req.params.id, req.body, tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Urgent alert updated successfully', alert);
  } catch (error) {
    next(error);
  }
};

export const deleteAlert = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    await urgentService.deleteAlert(req.params.id, tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Urgent alert disabled successfully', null);
  } catch (error) {
    next(error);
  }
};
