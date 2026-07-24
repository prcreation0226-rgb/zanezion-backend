import * as organizationRepository from '../repositories/organization.repository.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';

export const createOrganization = async (data, performerId) => {
  const exists = await organizationRepository.findOrganizationByEmail(data.email);
  if (exists) throw new AppError('Organization with this email already exists', 400);

  const org = await organizationRepository.createOrganization(data);

  await logAudit({
    module: 'ORGANIZATIONS',
    action: 'CREATE',
    description: `Created organization ${org.name}`,
    newValue: org,
    performedBy: performerId
  });

  return org;
};

export const getOrganizations = async (query) => {
  return await organizationRepository.findAllOrganizations(query);
};

export const getOrganizationById = async (id) => {
  const org = await organizationRepository.findOrganizationById(id);
  if (!org) throw new AppError('Organization not found', 404);
  return org;
};

export const updateOrganization = async (id, data, performerId) => {
  const org = await organizationRepository.findOrganizationById(id);
  if (!org) throw new AppError('Organization not found', 404);

  const updatedOrg = await organizationRepository.updateOrganization(id, data);

  await logAudit({
    module: 'ORGANIZATIONS',
    action: 'UPDATE',
    description: `Updated organization ${updatedOrg.name}`,
    oldValue: org,
    newValue: updatedOrg,
    performedBy: performerId
  });

  return updatedOrg;
};

export const suspendOrganization = async (id, performerId) => {
  return await updateOrganization(id, { status: 'suspended' }, performerId);
};

export const activateOrganization = async (id, performerId) => {
  return await updateOrganization(id, { status: 'active' }, performerId);
};
