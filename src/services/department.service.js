import * as departmentRepository from '../repositories/department.repository.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';

export const createDepartment = async (data, performerId, tenantId) => {
  const existingCode = await departmentRepository.findDepartmentByCodeAndTenant(data.code, tenantId);
  if (existingCode) {
    throw new AppError('Department code already exists in this tenant', 400);
  }

  const newDepartment = await departmentRepository.createDepartment({ ...data, tenantId });

  await logAudit({
    module: 'DEPARTMENTS',
    action: 'CREATE',
    description: `Created department ${newDepartment.name}`,
    newValue: newDepartment,
    performedBy: performerId
  });

  return newDepartment;
};

export const getDepartments = async (tenantId, query) => {
  return await departmentRepository.findAllDepartments(tenantId, query);
};

export const getDepartmentById = async (id, tenantId) => {
  const department = await departmentRepository.findDepartmentById(id);
  if (!department || (tenantId !== null && department.tenantId !== tenantId)) {
    throw new AppError('Department not found', 404);
  }
  return department;
};

export const updateDepartment = async (id, data, tenantId, performerId) => {
  const department = await getDepartmentById(id, tenantId);

  if (data.code && data.code !== department.code) {
    const existingCode = await departmentRepository.findDepartmentByCodeAndTenant(data.code, tenantId);
    if (existingCode) {
      throw new AppError('Department code already exists', 400);
    }
  }

  const updatedDepartment = await departmentRepository.updateDepartment(id, data);

  await logAudit({
    module: 'DEPARTMENTS',
    action: 'UPDATE',
    description: `Updated department ${updatedDepartment.name}`,
    oldValue: department,
    newValue: updatedDepartment,
    performedBy: performerId
  });

  return updatedDepartment;
};

export const deleteDepartment = async (id, tenantId, performerId) => {
  const department = await getDepartmentById(id, tenantId);

  // Consider soft delete or checking if employees are assigned before deleting
  await departmentRepository.deleteDepartment(id);

  await logAudit({
    module: 'DEPARTMENTS',
    action: 'DELETE',
    description: `Deleted department ${department.name}`,
    oldValue: department,
    performedBy: performerId
  });

  return true;
};
