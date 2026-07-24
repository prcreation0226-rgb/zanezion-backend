import * as invoiceService from '../services/invoice.service.js';
import { sendResponse } from '../utils/response.js';

import { resolveTenantId } from '../utils/tenantResolver.js';
export const generateInvoice = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToUse = isSuperAdmin ? (req.body.tenantId || req.user.tenantId || 1) : (req.user.tenantId || 1);

    const invoice = await invoiceService.generateInvoice(req.body, req.user.id, tenantIdToUse);
    sendResponse(res, 201, 'Invoice generated successfully', invoice);
  } catch (error) {
    next(error);
  }
};

export const getInvoices = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    if (['INDIVIDUAL_CLIENT'].includes(req.user.role?.name)) {
      req.query.clientId = req.user.clientId;
    }

    const result = await invoiceService.getInvoices(tenantIdToFilter, req.query);
    sendResponse(res, 200, 'Invoices fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getInvoiceById = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);
    const clientIdToFilter = ['INDIVIDUAL_CLIENT'].includes(req.user.role?.name) ? req.user.clientId : null;

    const invoice = await invoiceService.getInvoiceById(Number(req.params.id), tenantIdToFilter, clientIdToFilter);
    sendResponse(res, 200, 'Invoice fetched successfully', invoice);
  } catch (error) {
    next(error);
  }
};

export const updateInvoiceStatus = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);
    const { status } = req.body;

    const updatedInvoice = await invoiceService.updateInvoiceStatus(Number(req.params.id), status, tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Invoice status updated successfully', updatedInvoice);
  } catch (error) {
    next(error);
  }
};

export const updateInvoice = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const updatedInvoice = await invoiceService.updateInvoice(Number(req.params.id), req.body, tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Invoice updated successfully', updatedInvoice);
  } catch (error) {
    next(error);
  }
};

export const deleteInvoice = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const deletedInvoice = await invoiceService.deleteInvoice(Number(req.params.id), tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Invoice deleted successfully', deletedInvoice);
  } catch (error) {
    next(error);
  }
};
