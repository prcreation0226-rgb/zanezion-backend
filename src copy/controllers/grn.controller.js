import * as grnService from '../services/grn.service.js';
import { sendResponse } from '../utils/response.js';

export const createGRN = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToUse = isSuperAdmin ? (req.body.tenantId || req.user.tenantId || 1) : (req.user.tenantId || 1);

    const grn = await grnService.createGRN(req.body, req.user.id, tenantIdToUse);
    sendResponse(res, 201, 'GRN created successfully', grn);
  } catch (error) {
    next(error);
  }
};

export const getGRNs = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin && !req.query.tenantId ? null : (req.query.tenantId ? Number(req.query.tenantId) : req.user.tenantId);

    const result = await grnService.getGRNs(tenantIdToFilter, req.query);
    sendResponse(res, 200, 'GRNs fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getGRNById = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);

    const grn = await grnService.getGRNById(Number(req.params.id), tenantIdToFilter);
    sendResponse(res, 200, 'GRN fetched successfully', grn);
  } catch (error) {
    next(error);
  }
};

export const updateGRNStatus = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);
    const { status } = req.body;

    const updatedGRN = await grnService.updateGRNStatus(Number(req.params.id), status, tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'GRN status updated successfully', updatedGRN);
  } catch (error) {
    next(error);
  }
};

export const deleteGRN = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);

    await grnService.deleteGRN(Number(req.params.id), tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'GRN deleted successfully');
  } catch (error) {
    next(error);
  }
};
