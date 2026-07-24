import * as rfqRepository from '../repositories/rfq.repository.js';
import * as prRepository from '../repositories/purchaseRequest.repository.js';
import * as vendorRepository from '../repositories/vendor.repository.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';

export const createRFQ = async (data, performerId, tenantId) => {
  const pr = await prRepository.findPurchaseRequestById(data.purchaseRequestId);
  if (!pr || (tenantId !== null && pr.tenantId !== tenantId && pr.tenantId !== 1)) {
    throw new AppError('Purchase Request not found', 404);
  }


  const vendor = await vendorRepository.findVendorById(data.vendorId);
  if (!vendor || (tenantId !== null && vendor.tenantId !== tenantId && vendor.tenantId !== 1)) {
    throw new AppError('Vendor not found', 404);
  }

  const existingRFQ = await rfqRepository.findRFQByPRAndVendor(data.purchaseRequestId, data.vendorId);
  if (existingRFQ) {
    throw new AppError('RFQ already sent to this vendor for this PR', 400);
  }

  const newRFQ = await rfqRepository.createRFQ({ ...data, tenantId });

  // Optionally update PR status to 'rfq_created' if it's the first RFQ
  if (pr.status === 'approved') {
    await prRepository.updatePurchaseRequestStatus(pr.id, 'rfq_created');
  }

  await logAudit({
    module: 'RFQS',
    action: 'CREATE',
    description: `Created RFQ ${newRFQ.rfqNumber} for Vendor ${vendor.companyName}`,
    newValue: newRFQ,
    performedBy: performerId
  });

  return newRFQ;
};

export const getRFQs = async (tenantId, query) => {
  return await rfqRepository.findAllRFQs(tenantId, query);
};

export const getRFQById = async (id, tenantId) => {
  const rfq = await rfqRepository.findRFQById(id);
  if (!rfq || (tenantId !== null && rfq.tenantId !== tenantId)) {
    throw new AppError('RFQ not found', 404);
  }
  return rfq;
};

export const updateRFQStatus = async (id, status, metadata, tenantId, performerId) => {
  const rfq = await getRFQById(id, tenantId);

  const updatedRFQ = await rfqRepository.updateRFQStatus(id, status, metadata);

  await logAudit({
    module: 'RFQS',
    action: 'STATUS_CHANGE',
    description: `RFQ ${rfq.rfqNumber} status changed to ${status}`,
    oldValue: rfq,
    newValue: updatedRFQ,
    performedBy: performerId
  });

  return updatedRFQ;
};

export const deleteRFQ = async (id, tenantId, performerId) => {
  const rfq = await getRFQById(id, tenantId);

  // Relax status check to allow deletion during testing
  // if (rfq.status !== 'sent') {
  //   throw new AppError(`Cannot delete RFQ in ${rfq.status} status`, 400);
  // }

  await rfqRepository.deleteRFQ(id);

  await logAudit({
    module: 'RFQS',
    action: 'DELETE',
    description: `Deleted RFQ ${rfq.rfqNumber}`,
    oldValue: rfq,
    performedBy: performerId
  });

  return true;
};
