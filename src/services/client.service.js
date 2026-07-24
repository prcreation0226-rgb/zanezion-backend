import * as clientRepo from '../repositories/client.repository.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';
import { notifyTenantAdmins } from '../utils/sendNotification.js';

export const createClient = async (data, performerId, tenantId) => {
  const existingClient = await clientRepo.findClientByCode(data.clientCode, tenantId);
  if (existingClient) {
    throw new AppError('Client code must be unique', 400);
  }

  if (data.email) {
    const existingClientByEmail = await clientRepo.findClientByEmail(data.email);
    if (existingClientByEmail) {
      throw new AppError('Email address is already registered', 400);
    }
    const existingUserByEmail = await clientRepo.findUserByEmail(data.email);
    if (existingUserByEmail) {
      throw new AppError('Email address is already registered', 400);
    }
  }

  const newClient = await clientRepo.createClient({ ...data, tenantId });

  await logAudit({
    module: 'CLIENTS',
    action: 'CREATE',
    description: `Created Client ${newClient.companyName} (${newClient.clientCode})`,
    newValue: newClient,
    performedBy: performerId
  });

  await notifyTenantAdmins({
    tenantId,
    performerId,
    title: '👤 New Client Added',
    message: `Client "${newClient.companyName}" (${newClient.clientCode}) has been registered.`,
    type: 'info'
  });

  return newClient;
};

export const getClients = async (tenantId, query) => {
  return await clientRepo.findAllClients(tenantId, query);
};

export const getClientById = async (id, tenantId) => {
  const client = await clientRepo.findClientById(id);
  if (!client || (tenantId !== null && client.tenantId !== tenantId)) {
    throw new AppError('Client not found', 404);
  }
  return client;
};

export const updateClient = async (id, data, tenantId, performerId) => {
  const client = await getClientById(id, tenantId);

  if (data.email && data.email !== client.email) {
    const existingClientByEmail = await clientRepo.findClientByEmail(data.email);
    if (existingClientByEmail) {
      throw new AppError('Email address is already registered', 400);
    }
    const existingUserByEmail = await clientRepo.findUserByEmail(data.email);
    if (existingUserByEmail) {
      throw new AppError('Email address is already registered', 400);
    }
  }

  if (data.status) {
    const userStatus = data.status.toLowerCase() === 'active' ? 'Active' : 'Inactive';
    await clientRepo.updateUserStatusByEmail(client.email, userStatus);
  }

  const updatedClient = await clientRepo.updateClient(id, data);

  await logAudit({
    module: 'CLIENTS',
    action: 'UPDATE',
    description: `Updated Client ${client.companyName}`,
    oldValue: client,
    newValue: updatedClient,
    performedBy: performerId
  });

  await notifyTenantAdmins({
    tenantId,
    performerId,
    title: '✏️ Client Updated',
    message: `Client "${client.companyName}" details have been updated.`,
    type: 'info'
  });

  return updatedClient;
};

export const deleteClient = async (id, tenantId, performerId) => {
  const client = await getClientById(id, tenantId);
  await clientRepo.deleteClient(id);

  await logAudit({
    module: 'CLIENTS',
    action: 'DELETE',
    description: `Deleted Client ${client.companyName}`,
    oldValue: client,
    performedBy: performerId
  });

  await notifyTenantAdmins({
    tenantId,
    performerId,
    title: '🗑️ Client Removed',
    message: `Client "${client.companyName}" has been deleted.`,
    type: 'alert'
  });

  return true;
};

// --- Contact Methods ---

export const addClientContact = async (clientId, data, performerId, tenantId) => {
  const client = await getClientById(clientId, tenantId);
  
  const contact = await clientRepo.createClientContact(clientId, data, tenantId);

  await logAudit({
    module: 'CLIENTS',
    action: 'ADD_CONTACT',
    description: `Added contact ${contact.name} to Client ${client.companyName}`,
    newValue: contact,
    performedBy: performerId
  });

  return contact;
};

export const removeClientContact = async (clientId, contactId, performerId, tenantId) => {
  const client = await getClientById(clientId, tenantId); // Validates client ownership
  
  await clientRepo.deleteClientContact(contactId);

  await logAudit({
    module: 'CLIENTS',
    action: 'REMOVE_CONTACT',
    description: `Removed a contact from Client ${client.companyName}`,
    performedBy: performerId
  });

  return true;
};
