import * as permissionRepository from '../repositories/permission.repository.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';

export const createPermission = async (data, performerId) => {
  const exists = await permissionRepository.findPermissionByModuleAndAction(data.module, data.action);
  if (exists) throw new AppError('Permission for this module and action already exists', 400);

  const permission = await permissionRepository.createPermission(data);

  await logAudit({
    module: 'PERMISSIONS',
    action: 'CREATE',
    description: `Created permission ${permission.name}`,
    newValue: permission,
    performedBy: performerId
  });

  return permission;
};

export const getPermissions = async (query) => {
  return await permissionRepository.findAllPermissions(query);
};

export const getPermissionById = async (id) => {
  const permission = await permissionRepository.findPermissionById(id);
  if (!permission) throw new AppError('Permission not found', 404);
  return permission;
};

export const updatePermission = async (id, data, performerId) => {
  const permission = await permissionRepository.findPermissionById(id);
  if (!permission) throw new AppError('Permission not found', 404);

  const updatedPermission = await permissionRepository.updatePermission(id, data);

  await logAudit({
    module: 'PERMISSIONS',
    action: 'UPDATE',
    description: `Updated permission ${updatedPermission.name}`,
    oldValue: permission,
    newValue: updatedPermission,
    performedBy: performerId
  });

  return updatedPermission;
};

export const deletePermission = async (id, performerId) => {
  const permission = await permissionRepository.findPermissionById(id);
  if (!permission) throw new AppError('Permission not found', 404);

  await permissionRepository.deletePermission(id);

  await logAudit({
    module: 'PERMISSIONS',
    action: 'DELETE',
    description: `Deleted permission ${permission.name}`,
    oldValue: permission,
    performedBy: performerId
  });

  return true;
};
