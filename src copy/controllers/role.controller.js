import * as roleService from '../services/role.service.js';
import { sendResponse } from '../utils/response.js';

export const getMenus = async (req, res, next) => {
  try {
    const menus = await roleService.getMenus();
    sendResponse(res, 200, 'Menus fetched successfully', menus);
  } catch (error) {
    next(error);
  }
};

export const getRolePermissions = async (req, res, next) => {
  try {
    const permissions = await roleService.getRolePermissions(Number(req.params.id));
    sendResponse(res, 200, 'Role permissions fetched successfully', permissions);
  } catch (error) {
    next(error);
  }
};

export const createRole = async (req, res, next) => {
  try {
    const role = await roleService.createRole(req.body, req.user.id);
    sendResponse(res, 201, 'Role created successfully', role);
  } catch (error) {
    next(error);
  }
};

export const getRoles = async (req, res, next) => {
  try {
    const roles = await roleService.getRoles(req.query);
    sendResponse(res, 200, 'Roles fetched successfully', roles);
  } catch (error) {
    next(error);
  }
};

export const getRoleById = async (req, res, next) => {
  try {
    const role = await roleService.getRoleById(Number(req.params.id));
    sendResponse(res, 200, 'Role fetched successfully', role);
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (req, res, next) => {
  try {
    const role = await roleService.updateRole(Number(req.params.id), req.body, req.user.id);
    sendResponse(res, 200, 'Role updated successfully', role);
  } catch (error) {
    next(error);
  }
};

export const deleteRole = async (req, res, next) => {
  try {
    await roleService.deleteRole(Number(req.params.id), req.user.id);
    sendResponse(res, 200, 'Role deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const assignPermissions = async (req, res, next) => {
  try {
    // Expecting req.body.permissions array like [{ menu_id, can_view, can_add, can_edit, can_delete }]
    await roleService.assignPermissions(Number(req.params.id), req.body.permissions, req.user.id);
    sendResponse(res, 200, 'Permissions assigned successfully');
  } catch (error) {
    next(error);
  }
};

export const removePermissions = async (req, res, next) => {
  try {
    await roleService.removePermissions(Number(req.params.id), req.body.permissionIds, req.user.id);
    sendResponse(res, 200, 'Permissions removed successfully');
  } catch (error) {
    next(error);
  }
};
