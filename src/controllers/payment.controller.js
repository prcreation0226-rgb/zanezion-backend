import * as paymentService from '../services/payment.service.js';
import { sendResponse } from '../utils/response.js';

import { resolveTenantId } from '../utils/tenantResolver.js';
export const receivePayment = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToUse = isSuperAdmin ? (req.body.tenantId || req.user.tenantId || 1) : (req.user.tenantId || 1);

    const result = await paymentService.receivePayment(req.body, req.user.id, tenantIdToUse);
    sendResponse(res, 201, 'Payment received and receipt generated successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getPayments = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const result = await paymentService.getPayments(tenantIdToFilter, req.query);
    sendResponse(res, 200, 'Payments fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getReceiptById = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const receipt = await paymentService.getReceiptById(Number(req.params.id), tenantIdToFilter);
    sendResponse(res, 200, 'Receipt fetched successfully', receipt);
  } catch (error) {
    next(error);
  }
};
