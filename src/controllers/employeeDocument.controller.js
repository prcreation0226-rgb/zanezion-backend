import * as documentService from '../services/employeeDocument.service.js';
import { sendResponse } from '../utils/response.js';

import { resolveTenantId } from '../utils/tenantResolver.js';
export const createDocument = async (req, res, next) => {
  try {
    const document = await documentService.createDocument(req.body, req.user.id, req.user.tenantId);
    sendResponse(res, 201, 'Document uploaded successfully', document);
  } catch (error) {
    next(error);
  }
};

export const getDocuments = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const result = await documentService.getDocuments(tenantIdToFilter, req.query);
    sendResponse(res, 200, 'Documents fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getDocumentById = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const document = await documentService.getDocumentById(Number(req.params.id), tenantIdToFilter);
    sendResponse(res, 200, 'Document fetched successfully', document);
  } catch (error) {
    next(error);
  }
};

export const updateDocument = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const updatedDocument = await documentService.updateDocument(Number(req.params.id), req.body, tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Document updated successfully', updatedDocument);
  } catch (error) {
    next(error);
  }
};

export const verifyDocument = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);
    const { verificationStatus } = req.body;

    const updatedDocument = await documentService.verifyDocument(Number(req.params.id), verificationStatus, tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Document verification updated successfully', updatedDocument);
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    await documentService.deleteDocument(Number(req.params.id), tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Document deleted successfully');
  } catch (error) {
    next(error);
  }
};
