import * as conciergeService from '../services/concierge.service.js';
import { sendResponse } from '../utils/response.js';

const handleRequest = async (req, res, next, serviceFn, successMsg) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    let tenantId;
    
    if (req.method === 'GET') {
      tenantId = isSuperAdmin && !req.query.tenantId ? null : (req.query.tenantId ? Number(req.query.tenantId) : req.user.tenantId);
      const result = await serviceFn(tenantId);
      sendResponse(res, 200, successMsg, result);
    } else if (req.method === 'POST') {
      tenantId = isSuperAdmin ? (req.body.tenantId || req.user.tenantId || 1) : (req.user.tenantId || 1);
      const result = await serviceFn(req.body, req.user.id, tenantId);
      sendResponse(res, 201, successMsg, result);
    } else if (req.method === 'PUT') {
      tenantId = isSuperAdmin ? null : req.user.tenantId;
      const result = await serviceFn(req.params.id, req.body, tenantId, req.user.id);
      sendResponse(res, 200, successMsg, result);
    } else if (req.method === 'DELETE') {
      tenantId = isSuperAdmin ? null : req.user.tenantId;
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
