import * as prRepository from '../repositories/purchaseRequest.repository.js';
import * as departmentRepository from '../repositories/department.repository.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';
import prisma from '../config/db.js';

const getEmployeeIdByUserId = async (userId) => {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) return 1; // Fallback for Super Admins / unmapped users
  return employee.id;
};

export const createPurchaseRequest = async (data, performerId, tenantId) => {
  let employeeId = await getEmployeeIdByUserId(performerId);
  if (data.requester_id || data.requestedBy) {
    employeeId = await getEmployeeIdByUserId(Number(data.requester_id || data.requestedBy));
  }

  let finalDepartmentId = data.departmentId ? Number(data.departmentId) : null;
  let department = finalDepartmentId ? await departmentRepository.findDepartmentById(finalDepartmentId) : null;

  if (!department || (tenantId !== null && department.tenantId !== tenantId)) {
    // Graceful fallback: find the first available department for this tenant
    const tenantDepts = await prisma.department.findMany({ where: { tenantId } });
    if (tenantDepts.length > 0) {
      department = tenantDepts[0];
      finalDepartmentId = department.id;
    } else {
      // Auto-create a default department for this tenant so requests never fail
      console.log(`[PR] No departments found for tenant ${tenantId}. Auto-creating default "Operations" department.`);
      department = await prisma.department.create({
        data: {
          name: 'Operations',
          code: `OPS-${tenantId}`,
          status: 'active',
          tenantId: tenantId
        }
      });
      finalDepartmentId = department.id;
    }
  }

  const safePrData = {
    title: data.title || data.requestType || 'Purchase Request',
    description: `[userId:${performerId}] ${data.description || ''}`.trim(),
    departmentId: finalDepartmentId,
    requestedBy: employeeId,
    status: data.status ? String(data.status).toLowerCase() : 'draft',
    priority: data.priority || 'medium'
  };

  const safeItems = Array.isArray(data.items) ? data.items.map(item => ({
    itemName: item.itemName || item.name || 'Unknown Item',
    description: item.description || '',
    quantity: Number(item.quantity || item.qty || 1),
    unit: item.unit || 'Pieces',
    estimatedCost: Number(item.estimatedCost || item.price || 0)
  })) : [];

  const newPr = await prRepository.createPurchaseRequest(safePrData, safeItems, tenantId);

  await logAudit({
    module: 'PURCHASE_REQUESTS',
    action: 'CREATE',
    description: `Created PR ${newPr.prNumber}`,
    newValue: newPr,
    performedBy: performerId
  });

  return newPr;
};

export const getPurchaseRequests = async (tenantId, query, user) => {
  const roleName = String(user?.role?.name || user?.role || '').toUpperCase();
  const isStaff = roleName === 'STAFF';

  if (isStaff) {
    // Staff members only see their own requests
    query.requestedBy = await getEmployeeIdByUserId(user.id);
  }
  // Clients see ALL their own PRs (scoped by tenantId) so they can track status.
  // Admin sees all PRs from all tenants (tenantId = null).
  return await prRepository.findAllPurchaseRequests(tenantId, query);
};

export const getPurchaseRequestById = async (id, tenantId) => {
  const pr = await prRepository.findPurchaseRequestById(id);
  if (!pr) {
    throw new AppError('Purchase Request not found in database', 404);
  }
  if (tenantId !== null && pr.tenantId !== tenantId) {
    throw new AppError(`Purchase Request belongs to a different tenant (PR tenant: ${pr.tenantId}, User tenant: ${tenantId})`, 404);
  }
  return pr;
};

export const updatePurchaseRequest = async (id, data, tenantId, performerId) => {
  const pr = await getPurchaseRequestById(id, tenantId);

  // Relaxing status locks so admins/clients can correct mistakes
  // const unupdatableStatuses = ['completed', 'cancelled'];
  // if (unupdatableStatuses.includes(String(pr.status).toLowerCase())) {
  //   throw new AppError(`Cannot update PR in ${pr.status} status`, 400);
  // }

  const safePrData = {};
  if (data.title) safePrData.title = data.title;
  if (data.description !== undefined) safePrData.description = data.description;
  if (data.departmentId) safePrData.departmentId = Number(data.departmentId);
  if (data.priority) safePrData.priority = data.priority;
  if (data.status) safePrData.status = String(data.status).toLowerCase();

  if (data.requester_id) {
    const employeeId = await getEmployeeIdByUserId(Number(data.requester_id));
    safePrData.requestedBy = employeeId;
  } else if (data.requestedBy) {
    safePrData.requestedBy = Number(data.requestedBy);
  }

  const safeItems = Array.isArray(data.items) ? data.items.map(item => ({
    itemName: item.itemName || item.name || 'Unknown Item',
    description: item.description || '',
    quantity: Number(item.quantity || item.qty || 1),
    unit: item.unit || 'Pieces',
    estimatedCost: Number(item.estimatedCost || item.price || 0)
  })) : undefined;

  const updatedPr = await prRepository.updatePurchaseRequest(id, safePrData, safeItems);

  await logAudit({
    module: 'PURCHASE_REQUESTS',
    action: 'UPDATE',
    description: `Updated PR ${pr.prNumber}`,
    oldValue: pr,
    newValue: updatedPr,
    performedBy: performerId
  });

  return updatedPr;
};

export const updatePurchaseRequestStatus = async (id, status, tenantId, performerId) => {
  const pr = await getPurchaseRequestById(id, tenantId);

  // Status transitions
  const validTransitions = {
    'draft': ['submitted', 'cancelled', 'pending'],
    'pending': ['approved', 'rejected', 'ordered', 'submitted'],
    'submitted': ['department_approved', 'rejected', 'cancelled', 'ordered', 'pending'],
    'department_approved': ['procurement_review', 'rejected', 'ordered', 'pending'],
    'procurement_review': ['approved', 'rejected', 'ordered', 'pending'],
    'approved': ['rfq_created', 'ordered', 'pending'],
    'rfq_created': ['ordered', 'pending'],
    'ordered': ['completed', 'pending'],
    'completed': ['pending', 'ordered', 'draft'],
    'rejected': ['pending'],
    'cancelled': ['draft', 'pending']
  };

  const currentStatusClean = String(pr.status || 'draft').toLowerCase();
  const targetStatusClean = String(status || 'pending').toLowerCase();

  const allowed = validTransitions[currentStatusClean] || [];
  if (!allowed.includes(targetStatusClean) && currentStatusClean !== targetStatusClean) {
    throw new AppError(`Invalid status transition from ${pr.status} to ${status}`, 400);
  }

  const updatedPr = await prRepository.updatePurchaseRequestStatus(id, targetStatusClean);

  if (targetStatusClean === 'approved') {
    // Check if a PO already exists for this purchase request to avoid duplicates
    const existingPO = await prisma.purchaseOrder.findFirst({
      where: { purchaseRequestId: pr.id }
    });
    if (!existingPO) {
      // Find a default vendor for this tenant
      const defaultVendor = await prisma.vendor.findFirst({
        where: {
          OR: [
            { tenantId: pr.tenantId },
            { tenantId: 1 }
          ]
        }
      });
      const vendorId = defaultVendor ? defaultVendor.id : 1;

      // Calculate total amount from purchase request items
      const prItems = await prisma.purchaseRequestItem.findMany({
        where: { purchaseRequestId: pr.id }
      });
      const totalAmount = prItems.reduce((sum, item) => sum + ((item.estimatedCost || 0) * (item.quantity || 0)), 0);

      // Generate PO number
      const count = await prisma.purchaseOrder.count({ where: { tenantId: pr.tenantId } });
      const prefix = 'PO-' + String(pr.tenantId).padStart(3, '0');
      const poNumber = `${prefix}-${String(count + 1).padStart(5, '0')}`;

      // Create PO automatically for the accepted/approved request
      await prisma.purchaseOrder.create({
        data: {
          tenantId: pr.tenantId,
          poNumber,
          vendorId,
          purchaseRequestId: pr.id,
          totalAmount,
          paymentTerms: 'Net 30',
          status: 'approved'
        }
      });
    }
  }

  await logAudit({
    module: 'PURCHASE_REQUESTS',
    action: 'STATUS_CHANGE',
    description: `PR ${pr.prNumber} status changed to ${status}`,
    oldValue: pr,
    newValue: updatedPr,
    performedBy: performerId
  });

  return updatedPr;
};

export const deletePurchaseRequest = async (id, tenantId, performerId) => {
  const pr = await getPurchaseRequestById(id, tenantId);

  // Relaxing status checks so user can delete PRs as requested
  // if (pr.status !== 'draft' && pr.status !== 'cancelled') {
  //   throw new AppError(`Cannot delete PR in ${pr.status} status`, 400);
  // }

  await prRepository.deletePurchaseRequest(id);

  await logAudit({
    module: 'PURCHASE_REQUESTS',
    action: 'DELETE',
    description: `Deleted PR ${pr.prNumber}`,
    oldValue: pr,
    performedBy: performerId
  });

  return true;
};
