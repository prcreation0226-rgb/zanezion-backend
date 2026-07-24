import * as departmentService from '../services/department.service.js';
import { sendResponse } from '../utils/response.js';

import { resolveTenantId } from '../utils/tenantResolver.js';
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
    const tenantIdToFilter = resolveTenantId(req);

    const result = await departmentService.getDepartments(tenantIdToFilter, req.query);
    sendResponse(res, 200, 'Departments fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getDepartmentById = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const department = await departmentService.getDepartmentById(Number(req.params.id), tenantIdToFilter);
    sendResponse(res, 200, 'Department fetched successfully', department);
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const updatedDepartment = await departmentService.updateDepartment(Number(req.params.id), req.body, tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Department updated successfully', updatedDepartment);
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    await departmentService.deleteDepartment(Number(req.params.id), tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Department deleted successfully');
  } catch (error) {
    next(error);
  }
};
