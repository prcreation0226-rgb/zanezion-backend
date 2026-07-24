import * as tenantRepository from '../repositories/tenant.repository.js';
import * as organizationRepository from '../repositories/organization.repository.js';
import prisma from '../config/db.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';

export const createTenant = async (data, performerId) => {
  const org = await organizationRepository.findOrganizationById(data.organizationId);
  if (!org) throw new AppError('Organization not found', 404);

  const exists = await tenantRepository.findTenantByCode(data.tenantCode);
  if (exists) throw new AppError('Tenant with this code already exists', 400);

  const tenant = await tenantRepository.createTenant(data);

  await logAudit({
    module: 'TENANTS',
    action: 'CREATE',
    description: `Created tenant ${tenant.tenantCode} in org ${org.name}`,
    newValue: tenant,
    performedBy: performerId
  });

  await prisma.notification.create({
    data: {
      title: 'New Tenant Created',
      message: `Tenant ${tenant.tenantCode} created successfully.`,
      type: 'TENANT',
      userId: performerId
    }
  });

  return tenant;
};

export const getTenants = async (query) => {
  return await tenantRepository.findAllTenants(query);
};

export const getTenantById = async (id) => {
  const tenant = await tenantRepository.findTenantById(id);
  if (!tenant) throw new AppError('Tenant not found', 404);
  return tenant;
};

export const updateTenant = async (id, data, performerId) => {
  const tenant = await tenantRepository.findTenantById(id);
  if (!tenant) throw new AppError('Tenant not found', 404);

  const updatedTenant = await tenantRepository.updateTenant(id, data);

  await logAudit({
    module: 'TENANTS',
    action: 'UPDATE',
    description: `Updated tenant ${updatedTenant.tenantCode}`,
    oldValue: tenant,
    newValue: updatedTenant,
    performedBy: performerId
  });

  return updatedTenant;
};

export const suspendTenant = async (id, performerId) => {
  const updated = await updateTenant(id, { status: 'suspended' }, performerId);
  
  await prisma.notification.create({
    data: {
      title: 'Tenant Suspended',
      message: `Tenant ${updated.tenantCode} has been suspended.`,
      type: 'TENANT',
      userId: performerId
    }
  });

  return updated;
};

export const activateTenant = async (id, performerId) => {
  return await updateTenant(id, { status: 'active' }, performerId);
};

export const deleteTenant = async (id, performerId) => {
  const tenant = await tenantRepository.findTenantById(id);
  if (!tenant) throw new AppError('Tenant not found', 404);

  await tenantRepository.deleteTenant(id);

  await logAudit({
    module: 'TENANTS',
    action: 'DELETE',
    description: `Deleted tenant ${tenant.tenantCode}`,
    oldValue: tenant,
    performedBy: performerId
  });

  return true;
};
