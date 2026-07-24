import * as warehouseRepo from '../repositories/warehouse.repository.js';
import * as employeeRepo from '../repositories/employee.repository.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';
import { notifyTenantAdmins } from '../utils/sendNotification.js';
import prisma from '../config/db.js';

const getOrCreateEmployeeForUser = async (userId, tenantId) => {
  let employee = await prisma.employee.findFirst({ where: { userId: Number(userId) } });
  if (!employee) {
    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (user && (tenantId === null || user.tenantId === tenantId || user.tenantId === null)) {
      const effectiveTenantId = user.tenantId || tenantId || 1;
      
      let defaultDept = await prisma.department.findFirst({ where: { tenantId: effectiveTenantId, name: 'Operations' } });
      if (!defaultDept) {
        defaultDept = await prisma.department.create({
          data: { tenantId: effectiveTenantId, name: 'Operations', code: 'OPS-01' }
        });
      }
      
      let defaultDesig = await prisma.designation.findFirst({ where: { tenantId: effectiveTenantId, name: 'Warehouse Staff' } });
      if (!defaultDesig) {
        defaultDesig = await prisma.designation.create({
          data: { tenantId: effectiveTenantId, departmentId: defaultDept.id, name: 'Warehouse Staff' }
        });
      }

      employee = await prisma.employee.create({
        data: {
          userId: user.id,
          tenantId: effectiveTenantId,
          firstName: user.name?.split(' ')[0] || 'Unknown',
          lastName: user.name?.split(' ').slice(1).join(' ') || 'User',
          employeeCode: `EMP-${user.id}-${Date.now().toString().slice(-4)}`,
          departmentId: defaultDept.id,
          designationId: defaultDesig.id,
          joiningDate: new Date(),
          status: 'active'
        }
      });
    }
  }
  return employee;
};

export const createWarehouse = async (data, performerId, tenantId) => {
  // Soft-validate managerId (which comes in as User.id from frontend)
  if (data.managerId) {
    const manager = await getOrCreateEmployeeForUser(data.managerId, tenantId);
    if (!manager) {
      data.managerId = null;
    } else {
      data.managerId = manager.id;
    }
  }

  const newWarehouse = await warehouseRepo.createWarehouse({ ...data, tenantId });

  await logAudit({
    module: 'WAREHOUSES',
    action: 'CREATE',
    description: `Created Warehouse ${newWarehouse.name}`,
    newValue: newWarehouse,
    performedBy: performerId
  });

  // Real notification to all tenant admins
  await notifyTenantAdmins({
    tenantId,
    performerId,
    title: '🏭 New Warehouse Added',
    message: `Warehouse "${newWarehouse.name}" (${newWarehouse.location || 'No location'}) has been created.`,
    type: 'info'
  });

  return newWarehouse;
};

export const getWarehouses = async (tenantId, query) => {
  return await warehouseRepo.findAllWarehouses(tenantId, query);
};

export const getWarehouseById = async (id, tenantId) => {
  const warehouse = await warehouseRepo.findWarehouseById(id);
  if (!warehouse || (tenantId !== null && warehouse.tenantId !== tenantId)) {
    throw new AppError('Warehouse not found', 404);
  }
  return warehouse;
};

export const updateWarehouse = async (id, data, tenantId, performerId) => {
  const warehouse = await getWarehouseById(id, tenantId);

  // Soft-validate managerId (which comes in as User.id from frontend)
  if (data.managerId) {
    const manager = await getOrCreateEmployeeForUser(data.managerId, tenantId);
    if (!manager) {
      data.managerId = null;
    } else {
      data.managerId = manager.id;
    }
  }

  const updatedWarehouse = await warehouseRepo.updateWarehouse(id, data);

  await logAudit({
    module: 'WAREHOUSES',
    action: 'UPDATE',
    description: `Updated Warehouse ${warehouse.name}`,
    oldValue: warehouse,
    newValue: updatedWarehouse,
    performedBy: performerId
  });

  // Real notification
  await notifyTenantAdmins({
    tenantId,
    performerId,
    title: '✏️ Warehouse Updated',
    message: `Warehouse "${warehouse.name}" has been updated.`,
    type: 'info'
  });

  return updatedWarehouse;
};

export const deleteWarehouse = async (id, tenantId, performerId) => {
  const warehouse = await getWarehouseById(id, tenantId);
  await warehouseRepo.deleteWarehouse(id);

  await logAudit({
    module: 'WAREHOUSES',
    action: 'DELETE',
    description: `Deleted Warehouse ${warehouse.name}`,
    oldValue: warehouse,
    performedBy: performerId
  });

  // Real notification
  await notifyTenantAdmins({
    tenantId,
    performerId,
    title: '🗑️ Warehouse Removed',
    message: `Warehouse "${warehouse.name}" has been deleted.`,
    type: 'alert'
  });

  return true;
};
