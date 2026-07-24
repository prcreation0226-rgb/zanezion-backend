import * as grnRepo from '../repositories/grn.repository.js';
import * as poRepo from '../repositories/purchaseOrder.repository.js';
import * as warehouseRepo from '../repositories/warehouse.repository.js';
import * as employeeRepo from '../repositories/employee.repository.js';
import * as stockService from './stock.service.js'; // Will be created next
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';

const getEmployeeIdByUserId = async (userId) => {
  const employee = await employeeRepo.findEmployeeByUserId(userId);
  if (!employee) return 1; // Fallback for Super Admins / unmapped users
  return employee.id;
};

export const createGRN = async (data, performerId, tenantId) => {
  const { items, ...grnData } = data;

  const po = await poRepo.findPurchaseOrderById(data.purchaseOrderId);
  if (!po || (tenantId !== null && po.tenantId !== tenantId)) {
    throw new AppError('Purchase Order not found', 404);
  }

  if (!['approved', 'waiting_for_delivery'].includes(po.status)) {
    throw new AppError(`Cannot create GRN for PO in ${po.status} status`, 400);
  }

  if (po.vendorId !== data.vendorId) {
    throw new AppError('Vendor does not match the Purchase Order', 400);
  }

  const warehouse = await warehouseRepo.findWarehouseById(data.warehouseId);
  if (!warehouse || (tenantId !== null && warehouse.tenantId !== tenantId)) {
    throw new AppError('Warehouse not found', 404);
  }

  grnData.receivedById = await getEmployeeIdByUserId(performerId);
  grnData.status = 'draft';

  const newGRN = await grnRepo.createGRN(grnData, items, tenantId);

  await logAudit({
    module: 'GRN',
    action: 'CREATE',
    description: `Created GRN ${newGRN.grnNumber} for PO ${po.poNumber}`,
    newValue: newGRN,
    performedBy: performerId
  });

  return newGRN;
};

export const getGRNs = async (tenantId, query) => {
  return await grnRepo.findAllGRNs(tenantId, query);
};

export const getGRNById = async (id, tenantId) => {
  const grn = await grnRepo.findGRNById(id);
  if (!grn || (tenantId !== null && grn.tenantId !== tenantId)) {
    throw new AppError('GRN not found', 404);
  }
  return grn;
};

export const updateGRNStatus = async (id, status, tenantId, performerId) => {
  const grn = await getGRNById(id, tenantId);

  if (grn.status !== 'draft') {
    throw new AppError(`Cannot change status of a ${grn.status} GRN`, 400);
  }

  const updatedGRN = await grnRepo.updateGRNStatus(id, status);

  // If approved, trigger stock increment
  if (status === 'approved') {
    for (const item of grn.items) {
      if (item.acceptedQuantity > 0) {
        await stockService.processGRNStock(tenantId, grn.warehouseId, item.itemId, item.acceptedQuantity, grn.id, performerId);
      }
    }
    
    // Update PO Status (Simplified logic: assuming fully received, can be optimized later)
    await poRepo.updatePurchaseOrderStatus(grn.purchaseOrderId, 'closed');
  }

  await logAudit({
    module: 'GRN',
    action: 'STATUS_CHANGE',
    description: `GRN ${grn.grnNumber} status changed to ${status}`,
    oldValue: grn,
    newValue: updatedGRN,
    performedBy: performerId
  });

  return updatedGRN;
};

export const deleteGRN = async (id, tenantId, performerId) => {
  const grn = await getGRNById(id, tenantId);

  if (grn.status !== 'draft') {
    throw new AppError(`Cannot delete GRN in ${grn.status} status`, 400);
  }

  await grnRepo.deleteGRN(id);

  await logAudit({
    module: 'GRN',
    action: 'DELETE',
    description: `Deleted GRN ${grn.grnNumber}`,
    oldValue: grn,
    performedBy: performerId
  });

  return true;
};
