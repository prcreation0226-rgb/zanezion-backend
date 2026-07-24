import * as permissionService from '../services/permission.service.js';
import { sendResponse } from '../utils/response.js';

export const createPermission = async (req, res, next) => {
  try {
    const permission = await permissionService.createPermission(req.body, req.user.id);
    sendResponse(res, 201, 'Permission created successfully', permission);
  } catch (error) {
    next(error);
  }
};

export const getPermissions = async (req, res, next) => {
  try {
    const permissions = await permissionService.getPermissions(req.query);
    sendResponse(res, 200, 'Permissions fetched successfully', permissions);
  } catch (error) {
    next(error);
  }
};

export const getPermissionById = async (req, res, next) => {
  try {
    const permission = await permissionService.getPermissionById(Number(req.params.id));
    sendResponse(res, 200, 'Permission fetched successfully', permission);
  } catch (error) {
    next(error);
  }
};

export const updatePermission = async (req, res, next) => {
  try {
    const permission = await permissionService.updatePermission(Number(req.params.id), req.body, req.user.id);
    sendResponse(res, 200, 'Permission updated successfully', permission);
  } catch (error) {
    next(error);
  }
};

export const deletePermission = async (req, res, next) => {
  try {
    await permissionService.deletePermission(Number(req.params.id), req.user.id);
    sendResponse(res, 200, 'Permission deleted successfully');
  } catch (error) {
    next(error);
  }
};
