import bcrypt from 'bcrypt';
import * as userRepository from '../repositories/user.repository.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';

export const createUser = async (data, performerId, ipAddress, userAgent) => {
  const existingUser = await userRepository.findUserByEmailAndTenant(data.email, data.tenantId);
  if (existingUser) {
    throw new AppError('User with this email already exists in this tenant', 400);
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const newUser = await userRepository.createUser({
    ...data,
    password: hashedPassword
  });

  await logAudit({
    module: 'USERS',
    action: 'CREATE',
    description: `Created user ${newUser.email}`,
    newValue: { id: newUser.id, email: newUser.email, roleId: newUser.roleId },
    performedBy: performerId
  });

  // Remove password from response
  newUser.password = undefined;
  return newUser;
};

export const getUsers = async (tenantId, query) => {
  return await userRepository.findAllUsersByTenant(tenantId, query);
};

export const getUserById = async (id, tenantId) => {
  const user = await userRepository.findUserById(id);
  if (!user || (tenantId !== null && user.tenantId !== tenantId)) {
    throw new AppError('User not found', 404);
  }
  user.password = undefined;
  return user;
};

export const updateUser = async (id, data, tenantId, ipAddress, userAgent) => {
  const user = await userRepository.findUserById(id);
  if (!user || (tenantId !== null && user.tenantId !== tenantId)) throw new AppError('User not found', 404);

  const payload = { ...data };
  if (data.email && data.email !== user.email) {
    const existing = await userRepository.findUserByEmailAndTenant(data.email, tenantId);
    if (existing) throw new AppError('Email is already taken', 400);
  }

  if (data.password) {
    payload.password = await bcrypt.hash(data.password, 10);
  }

  const updatedUser = await userRepository.updateUser(id, payload);
  updatedUser.password = undefined;

  await logAudit({
    module: 'USERS',
    action: 'UPDATE',
    description: `Updated user ${updatedUser.email}`,
    newValue: payload,
    performedBy: id
  });

  return updatedUser;
};

export const deleteUser = async (id, tenantId, ipAddress, userAgent) => {
  const user = await userRepository.findUserById(id);
  if (!user || (tenantId !== null && user.tenantId !== tenantId)) throw new AppError('User not found', 404);

  await userRepository.softDeleteUser(id);

  await logAudit({
    module: 'USERS',
    action: 'DELETE',
    description: `Deleted user ${user.email}`,
    performedBy: id
  });

  return true;
};
