import * as departmentService from '../services/department.service.js';
import { sendResponse } from '../utils/response.js';

export const createDepartment = async (req, res, next) => {
  try {
    const department = await departmentService.createDepartment(req.body, req.user.id, req.user.tenantId);
    sendResponse(res, 201, 'Department created successfully', department);
  } catch (error) {
    next(error);
  }
};

export const getDepartments = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin && !req.query.tenantId ? null : (req.query.tenantId ? Number(req.query.tenantId) : req.user.tenantId);

    const result = await departmentService.getDepartments(tenantIdToFilter, req.query);
    sendResponse(res, 200, 'Departments fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getDepartmentById = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);

    const department = await departmentService.getDepartmentById(Number(req.params.id), tenantIdToFilter);
    sendResponse(res, 200, 'Department fetched successfully', department);
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);

    const updatedDepartment = await departmentService.updateDepartment(Number(req.params.id), req.body, tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Department updated successfully', updatedDepartment);
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);

    await departmentService.deleteDepartment(Number(req.params.id), tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Department deleted successfully');
  } catch (error) {
    next(error);
  }
};
