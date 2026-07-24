import * as rfqService from '../services/rfq.service.js';
import { sendResponse } from '../utils/response.js';

export const createRFQ = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToUse = isSuperAdmin ? (req.body.tenantId || req.user.tenantId || 1) : (req.user.tenantId || 1);

    const rfq = await rfqService.createRFQ(req.body, req.user.id, tenantIdToUse);
    sendResponse(res, 201, 'RFQ created successfully', rfq);
  } catch (error) {
    next(error);
  }
};

export const getRFQs = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin && !req.query.tenantId ? null : (req.query.tenantId ? Number(req.query.tenantId) : req.user.tenantId);

    const result = await rfqService.getRFQs(tenantIdToFilter, req.query);
    sendResponse(res, 200, 'RFQs fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getRFQById = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);

    const rfq = await rfqService.getRFQById(Number(req.params.id), tenantIdToFilter);
    sendResponse(res, 200, 'RFQ fetched successfully', rfq);
  } catch (error) {
    next(error);
  }
};

export const updateRFQStatus = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);
    const { status, metadata } = req.body;

    const updatedRFQ = await rfqService.updateRFQStatus(Number(req.params.id), status, metadata, tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'RFQ status updated successfully', updatedRFQ);
  } catch (error) {
    next(error);
  }
};

export const deleteRFQ = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);

    await rfqService.deleteRFQ(Number(req.params.id), tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'RFQ deleted successfully');
  } catch (error) {
    next(error);
  }
};
