import * as roleRepository from '../repositories/role.repository.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';
import prisma from '../config/db.js';

export const getMenus = async () => {
  return await prisma.menu.findMany({ orderBy: { id: 'asc' } });
};

export const getRolePermissions = async (roleId) => {
  return await prisma.roleMenu.findMany({
    where: { roleId },
    include: { menu: true }
  });
};

export const createRole = async (data, performerId) => {
  const exists = await roleRepository.findRoleByName(data.name);
  if (exists) throw new AppError('Role with this name already exists', 400);

  const role = await roleRepository.createRole(data);
  
  await logAudit({
    module: 'ROLES',
    action: 'CREATE',
    description: `Created role ${role.name}`,
    newValue: role,
    performedBy: performerId
  });

  return role;
};

export const getRoles = async (query) => {
  return await roleRepository.findAllRoles(query);
};

export const getRoleById = async (id) => {
  const role = await roleRepository.findRoleById(id);
  if (!role) throw new AppError('Role not found', 404);
  return role;
};

export const updateRole = async (id, data, performerId) => {
  const role = await roleRepository.findRoleById(id);
  if (!role) throw new AppError('Role not found', 404);

  const updatedRole = await roleRepository.updateRole(id, data);

  await logAudit({
    module: 'ROLES',
    action: 'UPDATE',
    description: `Updated role ${updatedRole.name}`,
    oldValue: role,
    newValue: updatedRole,
    performedBy: performerId
  });

  return updatedRole;
};

export const deleteRole = async (id, performerId) => {
  const role = await roleRepository.findRoleById(id);
  if (!role) throw new AppError('Role not found', 404);

  await roleRepository.deleteRole(id);

  await logAudit({
    module: 'ROLES',
    action: 'DELETE',
    description: `Deleted role ${role.name}`,
    oldValue: role,
    performedBy: performerId
  });

  return true;
};

export const assignPermissions = async (roleId, permissions, performerId) => {
  const role = await roleRepository.findRoleById(roleId);
  if (!role) throw new AppError('Role not found', 404);

  // permissions is an array: [{ menu_id, can_view, can_add, can_edit, can_delete }]
  for (const perm of permissions) {
    await prisma.roleMenu.upsert({
      where: {
        roleId_menuId: {
          roleId: roleId,
          menuId: perm.menu_id
        }
      },
      update: {
        can_view: perm.can_view,
        can_add: perm.can_add,
        can_edit: perm.can_edit,
        can_delete: perm.can_delete
      },
      create: {
        roleId: roleId,
        menuId: perm.menu_id,
        can_view: perm.can_view,
        can_add: perm.can_add,
        can_edit: perm.can_edit,
        can_delete: perm.can_delete
      }
    });
  }

  await logAudit({
    module: 'ROLES',
    action: 'ASSIGN_PERMISSIONS',
    description: `Updated menu matrix for role ${role.name}`,
    newValue: { permissions },
    performedBy: performerId
  });

  return true;
};

export const removePermissions = async (roleId, permissionIds, performerId) => {
  const role = await roleRepository.findRoleById(roleId);
  if (!role) throw new AppError('Role not found', 404);

  await roleRepository.removePermissionsFromRole(roleId, permissionIds);

  await logAudit({
    module: 'ROLES',
    action: 'REMOVE_PERMISSIONS',
    description: `Removed permissions from role ${role.name}`,
    oldValue: { permissionIds },
    performedBy: performerId
  });

  return true;
};
