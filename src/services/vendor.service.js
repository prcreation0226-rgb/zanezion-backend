import * as vendorRepository from '../repositories/vendor.repository.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';

export const createVendor = async (data, performerId, tenantId) => {
  const existingVendor = await vendorRepository.findVendorByCodeAndTenant(data.vendorCode, tenantId);
  if (existingVendor) {
    throw new AppError('Vendor code already exists in this tenant', 400);
  }

  const newVendor = await vendorRepository.createVendor({ ...data, tenantId });

  await logAudit({
    module: 'VENDORS',
    action: 'CREATE',
    description: `Created vendor ${newVendor.companyName}`,
    newValue: newVendor,
    performedBy: performerId
  });

  return newVendor;
};

export const getVendors = async (tenantId, query) => {
  return await vendorRepository.findAllVendors(tenantId, query);
};

export const getVendorById = async (id, tenantId) => {
  const vendor = await vendorRepository.findVendorById(id);
  const hasAccess = tenantId === null || 
                    (Array.isArray(tenantId) ? tenantId.map(Number).includes(Number(vendor?.tenantId)) : Number(vendor?.tenantId) === Number(tenantId));
  if (!vendor || !hasAccess) {
    throw new AppError('Vendor not found', 404);
  }
  return vendor;
};

export const updateVendor = async (id, data, tenantId, performerId) => {
  const vendor = await getVendorById(id, tenantId);

  if (data.vendorCode && data.vendorCode !== vendor.vendorCode) {
    const existing = await vendorRepository.findVendorByCodeAndTenant(data.vendorCode, tenantId);
    if (existing) {
      throw new AppError('Vendor code already exists', 400);
    }
  }

  const updatedVendor = await vendorRepository.updateVendor(id, data);

  await logAudit({
    module: 'VENDORS',
    action: 'UPDATE',
    description: `Updated vendor ${updatedVendor.companyName}`,
    oldValue: vendor,
    newValue: updatedVendor,
    performedBy: performerId
  });

  return updatedVendor;
};

export const deleteVendor = async (id, tenantId, performerId) => {
  const vendor = await getVendorById(id, tenantId);

  await vendorRepository.deleteVendor(id);

  await logAudit({
    module: 'VENDORS',
    action: 'DELETE',
    description: `Deleted vendor ${vendor.companyName}`,
    oldValue: vendor,
    performedBy: performerId
  });

  return true;
};
