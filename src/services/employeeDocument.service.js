import * as documentRepository from '../repositories/employeeDocument.repository.js';
import * as employeeRepository from '../repositories/employee.repository.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';

export const createDocument = async (data, performerId, tenantId) => {
  const employee = await employeeRepository.findEmployeeById(data.employeeId);
  if (!employee || (tenantId !== null && employee.tenantId !== tenantId)) {
    throw new AppError('Employee not found', 404);
  }

  const documentData = {
    ...data,
    tenantId,
    expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined
  };

  const newDocument = await documentRepository.createDocument(documentData);

  await logAudit({
    module: 'EMPLOYEE_DOCUMENTS',
    action: 'CREATE',
    description: `Uploaded document for employee ${employee.firstName} ${employee.lastName}`,
    newValue: newDocument,
    performedBy: performerId
  });

  return newDocument;
};

export const getDocuments = async (tenantId, query) => {
  return await documentRepository.findAllDocuments(tenantId, query);
};

export const getDocumentById = async (id, tenantId) => {
  const document = await documentRepository.findDocumentById(id);
  if (!document || (tenantId !== null && document.tenantId !== tenantId)) {
    throw new AppError('Document not found', 404);
  }
  return document;
};

export const updateDocument = async (id, data, tenantId, performerId) => {
  const document = await getDocumentById(id, tenantId);

  const documentData = { ...data };
  if (data.expiryDate) {
    documentData.expiryDate = new Date(data.expiryDate);
  }

  const updatedDocument = await documentRepository.updateDocument(id, documentData);

  await logAudit({
    module: 'EMPLOYEE_DOCUMENTS',
    action: 'UPDATE',
    description: `Updated document ID ${id}`,
    oldValue: document,
    newValue: updatedDocument,
    performedBy: performerId
  });

  return updatedDocument;
};

export const verifyDocument = async (id, status, tenantId, performerId) => {
  const document = await getDocumentById(id, tenantId);

  const updatedDocument = await documentRepository.updateDocument(id, {
    verificationStatus: status,
    verifiedBy: performerId,
    verifiedAt: new Date()
  });

  await logAudit({
    module: 'EMPLOYEE_DOCUMENTS',
    action: 'VERIFY',
    description: `Document ${id} marked as ${status}`,
    oldValue: document,
    newValue: updatedDocument,
    performedBy: performerId
  });

  return updatedDocument;
};

export const deleteDocument = async (id, tenantId, performerId) => {
  const document = await getDocumentById(id, tenantId);

  await documentRepository.deleteDocument(id);

  await logAudit({
    module: 'EMPLOYEE_DOCUMENTS',
    action: 'DELETE',
    description: `Deleted document ID ${id}`,
    oldValue: document,
    performedBy: performerId
  });

  return true;
};
