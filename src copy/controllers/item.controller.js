import * as itemService from '../services/item.service.js';
import { sendResponse } from '../utils/response.js';
import prisma from '../config/db.js';

export const createItem = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToUse = isSuperAdmin ? (req.body.tenantId || req.user.tenantId || 1) : (req.user.tenantId || 1);

    const item = await itemService.createItem(req.body, req.user.id, tenantIdToUse);
    sendResponse(res, 201, 'Item created successfully', item);
  } catch (error) {
    next(error);
  }
};

export const getItems = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin && !req.query.tenantId ? null : (req.query.tenantId ? Number(req.query.tenantId) : req.user.tenantId);

    const result = await itemService.getItems(tenantIdToFilter, req.query);
    sendResponse(res, 200, 'Items fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getItemById = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);

    const item = await itemService.getItemById(Number(req.params.id), tenantIdToFilter);
    sendResponse(res, 200, 'Item fetched successfully', item);
  } catch (error) {
    next(error);
  }
};

export const updateItem = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);

    const updatedItem = await itemService.updateItem(Number(req.params.id), req.body, tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Item updated successfully', updatedItem);
  } catch (error) {
    next(error);
  }
};

export const deleteItem = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);

    await itemService.deleteItem(Number(req.params.id), tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Item deleted successfully');
  } catch (error) {
    next(error);
  }
};
