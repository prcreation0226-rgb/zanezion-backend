import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as userRepository from '../repositories/user.repository.js';
import { config } from '../config/env.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';
import { sendEmail } from '../utils/mailer.js';
import prisma from '../config/db.js';

export const loginUser = async (email, password, tenantId, ipAddress, userAgent) => {
  const user = await userRepository.findUserByEmailAndTenant(email, tenantId);
  if (!user || (user.status?.toUpperCase() !== 'ACTIVE' && user.status?.toUpperCase() !== 'PENDING')) {
    throw new AppError('Invalid credentials or inactive user', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  // Attach client info
  if (user.tenantId) {
    let client = await prisma.client.findFirst({ where: { email: user.email } });
    if (!client) {
      client = await prisma.client.findFirst({ where: { tenantId: user.tenantId } });
    }
    if (client) {
      user.clientId = client.id;
      user.company_id = client.id;
    }
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, roleId: user.roleId, tenantId: user.tenantId },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiresIn }
  );

  // Calculate 7 days expiry for DB
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt
    }
  });

  await logAudit({
    module: 'AUTH',
    action: 'LOGIN',
    description: `User login: ${user.email}`,
    performedBy: user.id
  });

  const roleMenus = await prisma.roleMenu.findMany({
    where: { roleId: user.roleId },
    include: { menu: true }
  });

  const menuPermissions = roleMenus.map(rm => ({
    name: rm.menu.name,
    path: rm.menu.path,
    icon: rm.menu.icon,
    module: rm.menu.module,
    can_view: rm.can_view,
    can_add: rm.can_add,
    can_edit: rm.can_edit,
    can_delete: rm.can_delete
  }));

  return { user, token, refreshToken, menuPermissions };
};

export const refreshToken = async (tokenStr, ipAddress, userAgent) => {
  try {
    const decoded = jwt.verify(tokenStr, config.jwtRefreshSecret);
    const dbToken = await prisma.refreshToken.findUnique({ where: { token: tokenStr } });

    if (!dbToken || dbToken.expiresAt < new Date()) {
      throw new Error();
    }

    const user = await userRepository.findUserById(decoded.id);
    if (!user || user.status?.toUpperCase() !== 'ACTIVE') throw new Error();

    // Revoke old token
    await prisma.refreshToken.delete({ where: { token: tokenStr } });

    // Generate new tokens
    const newToken = jwt.sign(
      { id: user.id, email: user.email, roleId: user.roleId, tenantId: user.tenantId },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    const newRefreshToken = jwt.sign(
      { id: user.id },
      config.jwtRefreshSecret,
      { expiresIn: config.jwtRefreshExpiresIn }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt
      }
    });

    return { token: newToken, refreshToken: newRefreshToken };
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401);
  }
};

export const logoutUser = async (userId, tokenStr, ipAddress, userAgent) => {
  if (tokenStr) {
    await prisma.refreshToken.deleteMany({ where: { token: tokenStr } });
  }
  await logAudit({
    module: 'AUTH',
    action: 'LOGOUT',
    performedBy: userId
  });
  return true;
};

export const getProfile = async (userId) => {
  const user = await userRepository.findUserById(userId);
  if (!user) throw new AppError('User not found', 404);
  user.password = undefined;

  // Attach client info
  if (user.tenantId) {
    let client = await prisma.client.findFirst({ where: { email: user.email } });
    if (!client) {
      client = await prisma.client.findFirst({ where: { tenantId: user.tenantId } });
    }
    if (client) {
      user.clientId = client.id;
      user.company_id = client.id;
    }
  }

  const roleMenus = await prisma.roleMenu.findMany({
    where: { roleId: user.roleId },
    include: { menu: true }
  });

  const menuPermissions = roleMenus.map(rm => ({
    name: rm.menu.name,
    path: rm.menu.path,
    icon: rm.menu.icon,
    module: rm.menu.module,
    can_view: rm.can_view,
    can_add: rm.can_add,
    can_edit: rm.can_edit,
    can_delete: rm.can_delete
  }));

  user.menuPermissions = menuPermissions;
  return user;
};

export const updateProfile = async (userId, data, tenantId, ipAddress, userAgent) => {
  const payload = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.fullName !== undefined) payload.name = data.fullName;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.avatar !== undefined) payload.avatar = data.avatar;
  if (data.birthday !== undefined) payload.birthday = data.birthday ? new Date(data.birthday) : null;
  if (data.nibNumber !== undefined) payload.nibNumber = data.nibNumber || null;
  if (data.bankingInfo !== undefined) payload.bankingInfo = data.bankingInfo || {};

  if (data.password) {
    payload.password = await bcrypt.hash(data.password, 10);
  }

  const updated = await userRepository.updateUser(userId, payload);
  updated.password = undefined;

  await logAudit({
    module: 'AUTH',
    action: 'UPDATE_PROFILE',
    description: 'Updated user profile',
    newValue: payload,
    performedBy: userId
  });
  return updated;
};

export const changePassword = async (userId, tenantId, currentPassword, newPassword, ipAddress, userAgent) => {
  const user = await userRepository.findUserById(userId);
  if (!user) throw new AppError('User not found', 404);

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new AppError('Incorrect current password', 400);

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await userRepository.updateUser(userId, { password: hashedPassword });

  await logAudit({
    module: 'AUTH',
    action: 'CHANGE_PASSWORD',
    description: 'Changed password',
    performedBy: userId
  });

  return true;
};

export const forgotPassword = async (email, tenantId) => {
  const user = await userRepository.findUserByEmailAndTenant(email, tenantId);
  if (!user) throw new AppError('User not found', 404);

  // Generate Reset Token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  const resetTokenExpiry = new Date();
  resetTokenExpiry.setMinutes(resetTokenExpiry.getMinutes() + 10); // 10 minutes

  await userRepository.updateUser(user.id, {
    resetToken: hashedToken,
    resetTokenExpiry
  });

  // Send Email
  const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
  const message = `You requested a password reset. Please go to this link to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;

  await sendEmail(user.email, 'Zanezion Password Reset', message);

  await logAudit({
    module: 'AUTH',
    action: 'FORGOT_PASSWORD',
    description: `Password reset requested for ${user.email}`,
    performedBy: user.id
  });

  return 'Password reset link sent to email';
};

export const resetPassword = async (token, newPassword) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user by token
  const user = await prisma.user.findFirst({
    where: {
      resetToken: hashedToken,
      resetTokenExpiry: { gt: new Date() }
    }
  });

  if (!user) {
    throw new AppError('Token is invalid or has expired', 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await userRepository.updateUser(user.id, {
    password: hashedPassword,
    resetToken: null,
    resetTokenExpiry: null
  });

  // Cleanup all active refresh tokens for security
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

  await logAudit({
    module: 'AUTH',
    action: 'RESET_PASSWORD',
    description: `Password successfully reset for ${user.email}`,
    performedBy: user.id
  });

  return true;
};

export const signupUser = async (data, file) => {
  const { name, email, password, phone, accountType, role, companyName } = data;

  const roleMap = {
    customer: 'CUSTOMER',
    client: 'BUSINESS_CLIENT',
    saas_client: 'SAAS_CLIENT'
  };
  const dbRoleName = roleMap[role] || 'CUSTOMER';

  const roleRecord = await prisma.role.findUnique({ where: { name: dbRoleName } });
  if (!roleRecord) {
    throw new AppError(`Role ${dbRoleName} not found`, 400);
  }

  const existingUser = await prisma.user.findFirst({ where: { email } });
  if (existingUser) {
    throw new AppError('Email is already in use', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const isPersonalSignup = (
    accountType?.toLowerCase() === 'personal' ||
    role?.toLowerCase() === 'customer' ||
    dbRoleName === 'CUSTOMER'
  );

  if (isPersonalSignup) {
    // Create Organization + Tenant for the personal user (required for Client FK)
    const personalOrg = await prisma.organization.create({
      data: {
        name: name,
        email,
        phone: phone || ''
      }
    });

    const personalTenantCode = `PERSONAL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const personalTenant = await prisma.tenant.create({
      data: {
        organizationId: personalOrg.id,
        tenantCode: personalTenantCode,
        status: 'active'
      }
    });

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        roleId: roleRecord.id,
        tenantId: personalTenant.id,
        status: 'active'
      }
    });

    await prisma.client.create({
      data: {
        tenantId: personalTenant.id,
        clientCode: `CLT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        companyName: name,
        contactPerson: name,
        email,
        phone: phone || '',
        clientType: 'Personal',
        plan: 'Free',
        source: 'Website',
        status: 'active'
      }
    });

    return user;
  }

  const org = await prisma.organization.create({
    data: {
      name: companyName || name,
      email,
      phone
    }
  });

  const tenantCode = `TENANT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const tenant = await prisma.tenant.create({
    data: {
      organizationId: org.id,
      tenantCode,
      status: accountType === 'saas' ? 'pending_approval' : 'active'
    }
  });

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone,
      roleId: roleRecord.id,
      tenantId: tenant.id,
      status: 'active'
    }
  });

  await prisma.client.create({
    data: {
      tenantId: tenant.id,
      clientCode: `CLT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      companyName: companyName || name,
      contactPerson: name,
      email,
      phone: phone || '',
      clientType: accountType === 'saas' ? 'SaaS' : 'Business',
      source: file ? file.filename : null,
      status: 'active'
    }
  });

  return user;
};

export const registerStaff = async (data, files) => {
  const { name, email, password, phone, employment_status, birthday, bank_name, account_number, routing_number, nib_number } = data;

  const roleRecord = await prisma.role.findUnique({ where: { name: 'STAFF' } });
  if (!roleRecord) {
    throw new AppError('Role STAFF not found in system', 400);
  }

  const existingUser = await prisma.user.findFirst({ where: { email } });
  if (existingUser) {
    throw new AppError('Email is already in use', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Use a transaction to ensure both User and Employee are created together
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        roleId: roleRecord.id,
        status: 'pending' // Staff approval flow
      }
    });

    await tx.employee.create({
      data: {
        userId: newUser.id,
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ').slice(1).join(' ') || '',
        email,
        phone,
        status: 'pending',
        employmentType: employment_status || 'Full Time',
        // Optional tracking data can be added here
      }
    });

    return newUser;
  });

  await logAudit({
    module: 'AUTH',
    action: 'STAFF_REGISTER',
    description: `Staff registered: ${email}`,
    performedBy: user.id
  });

  return user;
};
