import * as designationService from '../services/designation.service.js';
import { sendResponse } from '../utils/response.js';

export const createDesignation = async (req, res, next) => {
  try {
    const designation = await designationService.createDesignation(req.body, req.user.id, req.user.tenantId);
    sendResponse(res, 201, 'Designation created successfully', designation);
  } catch (error) {
    next(error);
  }
};

export const getDesignations = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin && !req.query.tenantId ? null : (req.query.tenantId ? Number(req.query.tenantId) : req.user.tenantId);

    const result = await designationService.getDesignations(tenantIdToFilter, req.query);
    sendResponse(res, 200, 'Designations fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getDesignationById = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);

    const designation = await designationService.getDesignationById(Number(req.params.id), tenantIdToFilter);
    sendResponse(res, 200, 'Designation fetched successfully', designation);
  } catch (error) {
    next(error);
  }
};

export const updateDesignation = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);

    const updatedDesignation = await designationService.updateDesignation(Number(req.params.id), req.body, tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Designation updated successfully', updatedDesignation);
  } catch (error) {
    next(error);
  }
};

export const deleteDesignation = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);

    await designationService.deleteDesignation(Number(req.params.id), tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Designation deleted successfully');
  } catch (error) {
    next(error);
  }
};
