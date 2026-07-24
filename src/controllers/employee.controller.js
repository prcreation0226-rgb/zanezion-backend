import * as employeeService from '../services/employee.service.js';
import { sendResponse } from '../utils/response.js';

import { resolveTenantId } from '../utils/tenantResolver.js';
export const createEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.createEmployee(req.body, req.user.id, req.user.tenantId);
    sendResponse(res, 201, 'Employee created successfully', employee);
  } catch (error) {
    next(error);
  }
};

export const getEmployees = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const result = await employeeService.getEmployees(tenantIdToFilter, req.query);
    sendResponse(res, 200, 'Employees fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getEmployeeById = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const employee = await employeeService.getEmployeeById(Number(req.params.id), tenantIdToFilter);
    sendResponse(res, 200, 'Employee fetched successfully', employee);
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const updatedEmployee = await employeeService.updateEmployee(Number(req.params.id), req.body, tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Employee updated successfully', updatedEmployee);
  } catch (error) {
    next(error);
  }
};

export const deleteEmployee = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    await employeeService.deleteEmployee(Number(req.params.id), tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Employee deleted successfully');
  } catch (error) {
    next(error);
  }
};
