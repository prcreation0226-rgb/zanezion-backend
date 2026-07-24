import * as poService from '../services/purchaseOrder.service.js';
import { sendResponse } from '../utils/response.js';

export const createPurchaseOrder = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToUse = isSuperAdmin ? (req.body.tenantId || req.user.tenantId || 1) : (req.user.tenantId || 1);

    if (req.body.payment_terms && !req.body.paymentTerms) req.body.paymentTerms = req.body.payment_terms;
    if (req.body.total_amount && !req.body.totalAmount) req.body.totalAmount = req.body.total_amount;

    const po = await poService.createPurchaseOrder(req.body, req.user.id, tenantIdToUse);
    sendResponse(res, 201, 'Purchase Order created successfully', po);
  } catch (error) {
    next(error);
  }
};

export const getPurchaseOrders = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin && !req.query.tenantId ? null : (req.query.tenantId ? Number(req.query.tenantId) : req.user.tenantId);

    const result = await poService.getPurchaseOrders(tenantIdToFilter, req.query);
    sendResponse(res, 200, 'Purchase Orders fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getPurchaseOrderById = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);

    const po = await poService.getPurchaseOrderById(Number(req.params.id), tenantIdToFilter);
    sendResponse(res, 200, 'Purchase Order fetched successfully', po);
  } catch (error) {
    next(error);
  }
};

export const updatePurchaseOrderStatus = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);
    const { status } = req.body;

    const updatedPO = await poService.updatePurchaseOrderStatus(Number(req.params.id), status, tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Purchase Order status updated successfully', updatedPO);
  } catch (error) {
    next(error);
  }
};

export const updatePurchaseOrder = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);

    if (req.body.payment_terms && !req.body.paymentTerms) req.body.paymentTerms = req.body.payment_terms;
    if (req.body.total_amount && !req.body.totalAmount) req.body.totalAmount = req.body.total_amount;

    const updatedPO = await poService.updatePurchaseOrder(Number(req.params.id), req.body, tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Purchase Order updated successfully', updatedPO);
  } catch (error) {
    next(error);
  }
};

export const deletePurchaseOrder = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);

    await poService.deletePurchaseOrder(Number(req.params.id), tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Purchase Order deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const receivePurchaseOrderGoods = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);

    // Only Admin or Super Admin can mark receipt as approved
    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(req.user.role?.name);
    const body = { ...req.body };
    if (!isAdmin) {
      body.adminApproved = false;
    }

    const result = await poService.receivePurchaseOrderGoods(
      Number(req.params.id),
      body,
      tenantIdToFilter,
      req.user.id
    );
    sendResponse(res, 200, 'Purchase Order goods received successfully', result);
  } catch (error) {
    next(error);
  }
};

export const approvePurchaseOrderReceipt = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);

    const result = await poService.approvePurchaseOrderReceipt(
      Number(req.params.id),
      tenantIdToFilter,
      req.user.id
    );
    sendResponse(res, 200, 'Purchase Order receipt approved successfully', result);
  } catch (error) {
    next(error);
  }
};
