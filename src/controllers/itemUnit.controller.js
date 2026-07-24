import * as unitService from '../services/itemUnit.service.js';
import { sendResponse } from '../utils/response.js';

import { resolveTenantId } from '../utils/tenantResolver.js';
export const createItemUnit = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToUse = isSuperAdmin ? (req.body.tenantId || req.user.tenantId || 1) : (req.user.tenantId || 1);

    const unit = await unitService.createItemUnit(req.body, req.user.id, tenantIdToUse);
    sendResponse(res, 201, 'Item Unit created successfully', unit);
  } catch (error) {
    next(error);
  }
};

export const getItemUnits = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const result = await unitService.getItemUnits(tenantIdToFilter, req.query);
    sendResponse(res, 200, 'Item Units fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getItemUnitById = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const unit = await unitService.getItemUnitById(Number(req.params.id), tenantIdToFilter);
    sendResponse(res, 200, 'Item Unit fetched successfully', unit);
  } catch (error) {
    next(error);
  }
};

export const updateItemUnit = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const updatedUnit = await unitService.updateItemUnit(Number(req.params.id), req.body, tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Item Unit updated successfully', updatedUnit);
  } catch (error) {
    next(error);
  }
};

export const deleteItemUnit = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    await unitService.deleteItemUnit(Number(req.params.id), tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Item Unit deleted successfully');
  } catch (error) {
    next(error);
  }
};
