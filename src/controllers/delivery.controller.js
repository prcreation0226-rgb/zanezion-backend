import * as deliveryService from '../services/delivery.service.js';
import { sendResponse } from '../utils/response.js';
import { emitToTenant } from '../utils/socket.js';

import { resolveTenantId, resolveTenantIdForOperations } from '../utils/tenantResolver.js';

export const createDelivery = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToUse = isSuperAdmin ? (req.body.tenantId || req.user.tenantId || 1) : (req.user.tenantId || 1);

    const delivery = await deliveryService.createDelivery(req.body, req.user.id, tenantIdToUse);
    emitToTenant(delivery.tenantId, 'delivery_new', delivery);
    sendResponse(res, 201, 'Delivery created successfully', delivery);
  } catch (error) {
    next(error);
  }
};

export const getDeliveries = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantIdForOperations(req);
    const roleName = req.user.role?.name?.toUpperCase();

    if (['INDIVIDUAL_CLIENT', 'CUSTOMER'].includes(roleName)) {
      req.query.clientId = req.user.clientId;
    }

    const result = await deliveryService.getDeliveries(tenantIdToFilter, req.query);
    sendResponse(res, 200, 'Deliveries fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getDeliveryById = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantIdForOperations(req);
    const roleName = req.user.role?.name?.toUpperCase();
    const clientIdToFilter = ['INDIVIDUAL_CLIENT', 'CUSTOMER'].includes(roleName) ? req.user.clientId : null;

    const delivery = await deliveryService.getDeliveryById(Number(req.params.id), tenantIdToFilter, clientIdToFilter);
    sendResponse(res, 200, 'Delivery fetched successfully', delivery);
  } catch (error) {
    next(error);
  }
};

export const cancelDelivery = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantIdForOperations(req);
    const roleName = req.user.role?.name?.toUpperCase();
    const clientIdToFilter = ['INDIVIDUAL_CLIENT', 'CUSTOMER', 'BUSINESS_CLIENT', 'CLIENT'].includes(roleName) ? req.user.clientId : null;

    await deliveryService.cancelDelivery(Number(req.params.id), tenantIdToFilter, req.user.id, clientIdToFilter);
    sendResponse(res, 200, 'Delivery cancelled successfully');
  } catch (error) {
    next(error);
  }
};

export const updateDelivery = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantIdForOperations(req);
    const roleName = req.user.role?.name?.toUpperCase();
    const clientIdToFilter = ['INDIVIDUAL_CLIENT', 'CUSTOMER'].includes(roleName) ? req.user.clientId : null;

    const delivery = await deliveryService.updateDelivery(Number(req.params.id), req.body, tenantIdToFilter, req.user.id, clientIdToFilter);
    emitToTenant(delivery.tenantId, 'delivery_update', delivery);
    sendResponse(res, 200, 'Delivery updated successfully', delivery);
  } catch (error) {
    next(error);
  }
};

export const deleteDelivery = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantIdForOperations(req);
    const roleName = req.user.role?.name?.toUpperCase();
    const clientIdToFilter = ['INDIVIDUAL_CLIENT', 'CUSTOMER'].includes(roleName) ? req.user.clientId : null;

    await deliveryService.deleteDelivery(Number(req.params.id), tenantIdToFilter, req.user.id, clientIdToFilter);
    sendResponse(res, 200, 'Delivery and associated records deleted successfully');
  } catch (error) {
    next(error);
  }
};
