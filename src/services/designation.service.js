import * as designationRepository from '../repositories/designation.repository.js';
import * as departmentRepository from '../repositories/department.repository.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';

export const createDesignation = async (data, performerId, tenantId) => {
  // Validate department exists
  const department = await departmentRepository.findDepartmentById(data.departmentId);
  if (!department || (tenantId !== null && department.tenantId !== tenantId)) {
    throw new AppError('Department not found', 404);
  }

  const existingDesignation = await designationRepository.findDesignationByNameAndDepartment(data.name, data.departmentId, tenantId);
  if (existingDesignation) {
    throw new AppError('Designation name already exists in this department', 400);
  }

  const newDesignation = await designationRepository.createDesignation({ ...data, tenantId });

  await logAudit({
    module: 'DESIGNATIONS',
    action: 'CREATE',
    description: `Created designation ${newDesignation.name}`,
    newValue: newDesignation,
    performedBy: performerId
  });

  return newDesignation;
};

export const getDesignations = async (tenantId, query) => {
  return await designationRepository.findAllDesignations(tenantId, query);
};

export const getDesignationById = async (id, tenantId) => {
  const designation = await designationRepository.findDesignationById(id);
  if (!designation || (tenantId !== null && designation.tenantId !== tenantId)) {
    throw new AppError('Designation not found', 404);
  }
  return designation;
};

export const updateDesignation = async (id, data, tenantId, performerId) => {
  const designation = await getDesignationById(id, tenantId);

  if (data.departmentId && data.departmentId !== designation.departmentId) {
    const department = await departmentRepository.findDepartmentById(data.departmentId);
    if (!department || (tenantId !== null && department.tenantId !== tenantId)) {
      throw new AppError('Target department not found', 404);
    }
  }

  if (data.name && data.name !== designation.name) {
    const checkDeptId = data.departmentId || designation.departmentId;
    const existing = await designationRepository.findDesignationByNameAndDepartment(data.name, checkDeptId, tenantId);
    if (existing) {
      throw new AppError('Designation name already exists in this department', 400);
    }
  }

  const updatedDesignation = await designationRepository.updateDesignation(id, data);

  await logAudit({
    module: 'DESIGNATIONS',
    action: 'UPDATE',
    description: `Updated designation ${updatedDesignation.name}`,
    oldValue: designation,
    newValue: updatedDesignation,
    performedBy: performerId
  });

  return updatedDesignation;
};

export const deleteDesignation = async (id, tenantId, performerId) => {
  const designation = await getDesignationById(id, tenantId);

  await designationRepository.deleteDesignation(id);

  await logAudit({
    module: 'DESIGNATIONS',
    action: 'DELETE',
    description: `Deleted designation ${designation.name}`,
    oldValue: designation,
    performedBy: performerId
  });

  return true;
};
