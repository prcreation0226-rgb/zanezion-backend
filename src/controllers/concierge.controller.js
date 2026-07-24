import * as conciergeService from '../services/concierge.service.js';
import { sendResponse } from '../utils/response.js';

import { resolveTenantId } from '../utils/tenantResolver.js';
const handleRequest = async (req, res, next, serviceFn, successMsg) => {
  try {
    const isSuperAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role?.name || req.user.role);
    let tenantId;
    
    if (req.method === 'GET') {
      tenantId = resolveTenantId(req);
      if (req.query.tenantId && Number(req.query.tenantId) === 1) {
        tenantId = 1;
      }
      const result = await serviceFn(tenantId);
      sendResponse(res, 200, successMsg, result);
    } else if (req.method === 'POST') {
      tenantId = isSuperAdmin ? (req.body.tenantId || req.user.tenantId || 1) : (req.user.tenantId || 1);
      const result = await serviceFn(req.body, req.user.id, tenantId);
      sendResponse(res, 201, successMsg, result);
    } else if (req.method === 'PUT') {
      tenantId = resolveTenantId(req);
      const result = await serviceFn(req.params.id, req.body, tenantId, req.user.id);
      sendResponse(res, 200, successMsg, result);
    } else if (req.method === 'DELETE') {
      tenantId = resolveTenantId(req);
      await serviceFn(req.params.id, tenantId, req.user.id);
      sendResponse(res, 200, successMsg, null);
    }
  } catch (error) {
    next(error);
  }
};

export const createItem = (req, res, next) => handleRequest(req, res, next, conciergeService.createItem, 'Luxury item created');
export const getItems = (req, res, next) => handleRequest(req, res, next, conciergeService.getItems, 'Luxury items fetched');
export const updateItem = (req, res, next) => handleRequest(req, res, next, conciergeService.updateItem, 'Luxury item updated');
export const deleteItem = (req, res, next) => handleRequest(req, res, next, conciergeService.deleteItem, 'Luxury item deleted');
