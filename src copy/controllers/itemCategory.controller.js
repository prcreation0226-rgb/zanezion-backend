import * as categoryService from '../services/itemCategory.service.js';
import { sendResponse } from '../utils/response.js';

export const createItemCategory = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToUse = isSuperAdmin ? (req.body.tenantId || req.user.tenantId || 1) : (req.user.tenantId || 1);

    const category = await categoryService.createItemCategory(req.body, req.user.id, tenantIdToUse);
    sendResponse(res, 201, 'Item Category created successfully', category);
  } catch (error) {
    next(error);
  }
};

export const getItemCategories = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin && !req.query.tenantId ? null : (req.query.tenantId ? Number(req.query.tenantId) : req.user.tenantId);

    const result = await categoryService.getItemCategories(tenantIdToFilter, req.query);
    sendResponse(res, 200, 'Item Categories fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getItemCategoryById = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);

    const category = await categoryService.getItemCategoryById(Number(req.params.id), tenantIdToFilter);
    sendResponse(res, 200, 'Item Category fetched successfully', category);
  } catch (error) {
    next(error);
  }
};

export const updateItemCategory = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);

    const updatedCategory = await categoryService.updateItemCategory(Number(req.params.id), req.body, tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Item Category updated successfully', updatedCategory);
  } catch (error) {
    next(error);
  }
};

export const deleteItemCategory = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);

    await categoryService.deleteItemCategory(Number(req.params.id), tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Item Category deleted successfully');
  } catch (error) {
    next(error);
  }
};
