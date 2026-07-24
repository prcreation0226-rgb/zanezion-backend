import * as tenantService from '../services/tenant.service.js';
import { sendResponse } from '../utils/response.js';

export const createTenant = async (req, res, next) => {
  try {
    const tenant = await tenantService.createTenant(req.body, req.user.id);
    sendResponse(res, 201, 'Tenant created successfully', tenant);
  } catch (error) {
    next(error);
  }
};

export const getTenants = async (req, res, next) => {
  try {
    const tenants = await tenantService.getTenants(req.query);
    sendResponse(res, 200, 'Tenants fetched successfully', tenants);
  } catch (error) {
    next(error);
  }
};

export const getTenantById = async (req, res, next) => {
  try {
    const tenant = await tenantService.getTenantById(Number(req.params.id));
    sendResponse(res, 200, 'Tenant fetched successfully', tenant);
  } catch (error) {
    next(error);
  }
};

export const updateTenant = async (req, res, next) => {
  try {
    const tenant = await tenantService.updateTenant(Number(req.params.id), req.body, req.user.id);
    sendResponse(res, 200, 'Tenant updated successfully', tenant);
  } catch (error) {
    next(error);
  }
};

export const suspendTenant = async (req, res, next) => {
  try {
    const tenant = await tenantService.suspendTenant(Number(req.params.id), req.user.id);
    sendResponse(res, 200, 'Tenant suspended successfully', tenant);
  } catch (error) {
    next(error);
  }
};

export const activateTenant = async (req, res, next) => {
  try {
    const tenant = await tenantService.activateTenant(Number(req.params.id), req.user.id);
    sendResponse(res, 200, 'Tenant activated successfully', tenant);
  } catch (error) {
    next(error);
  }
};

export const deleteTenant = async (req, res, next) => {
  try {
    await tenantService.deleteTenant(Number(req.params.id), req.user.id);
    sendResponse(res, 200, 'Tenant deleted successfully');
  } catch (error) {
    next(error);
  }
};
