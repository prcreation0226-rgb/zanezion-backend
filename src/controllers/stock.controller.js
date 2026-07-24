import * as stockService from '../services/stock.service.js';
import { sendResponse } from '../utils/response.js';

import { resolveTenantId } from '../utils/tenantResolver.js';
export const adjustStock = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToUse = isSuperAdmin ? (req.body.tenantId || req.user.tenantId || 1) : (req.user.tenantId || 1);

    const result = await stockService.adjustStock(req.body, req.user.id, tenantIdToUse);
    sendResponse(res, 200, 'Stock adjusted successfully', result);
  } catch (error) {
    next(error);
  }
};

export const transferStock = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToUse = isSuperAdmin ? (req.body.tenantId || req.user.tenantId || 1) : (req.user.tenantId || 1);

    const result = await stockService.transferStock(req.body, req.user.id, tenantIdToUse);
    sendResponse(res, 200, 'Stock transferred successfully', result);
  } catch (error) {
    next(error);
  }
};

const checkIsClient = (user) => {
  const roleName = String(user?.role?.name || user?.role || '').toUpperCase();
  return roleName.includes('CLIENT') || roleName.includes('CUSTOMER');
};

export const getStock = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const isClient = checkIsClient(req.user);
    const isSaaSTenant = req.user.tenantId && Number(req.user.tenantId) !== 1;
    const tenantIdToFilter = isSuperAdmin && !req.query.tenantId ? null :
                             isClient ? [1, req.user.tenantId].filter(t => t !== null && t !== undefined).map(Number) :
                             isSaaSTenant ? Number(req.user.tenantId) :
                             (req.query.tenantId ? Number(req.query.tenantId) : req.user.tenantId);

    const result = await stockService.getStock(tenantIdToFilter, req.query);
    sendResponse(res, 200, 'Stock fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getMovements = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const isClient = checkIsClient(req.user);
    const isSaaSTenant = req.user.tenantId && Number(req.user.tenantId) !== 1;
    const tenantIdToFilter = isSuperAdmin && !req.query.tenantId ? null :
                             isClient ? [1, req.user.tenantId].filter(t => t !== null && t !== undefined).map(Number) :
                             isSaaSTenant ? Number(req.user.tenantId) :
                             (req.query.tenantId ? Number(req.query.tenantId) : req.user.tenantId);

    const result = await stockService.getMovements(tenantIdToFilter, req.query);
    sendResponse(res, 200, 'Stock movements fetched successfully', result);
  } catch (error) {
    next(error);
  }
};
