import * as clientService from '../services/client.service.js';
import * as userService from '../services/user.service.js';
import { sendResponse } from '../utils/response.js';
import prisma from '../config/db.js';
import bcrypt from 'bcrypt';

export const createClient = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    let tenantIdToUse = isSuperAdmin ? (req.body.tenantId || req.user.tenantId || 1) : (req.user.tenantId || 1);

    if (!tenantIdToUse) {
      tenantIdToUse = 1; // Fallback to a default tenant ID if none provided
    }

    const payload = req.body;

    // Safely extract and map ONLY the fields known to Prisma schema
    const clientData = {
      clientCode: payload.clientCode || `CLT-${Date.now().toString().slice(-6)}`,
      companyName: payload.companyName || payload.name || "Unknown Company",
      contactPerson: payload.contactPerson || payload.contact || payload.name || "Admin",
      email: payload.email,
      phone: payload.phone,
      address: payload.address || payload.location || null,
      city: payload.city || null,
      country: payload.country || payload.location || null,
      status: payload.status || "active",
      clientType: payload.clientType || payload.client_type || null,
      billingCycle: payload.billingCycle || payload.billing_cycle || null,
      paymentMethod: payload.paymentMethod || payload.payment_method || null,
      plan: payload.plan || null,
      logoUrl: payload.logoUrl || payload.logo || null,
      source: payload.source || null
    };

    const client = await clientService.createClient(clientData, req.user.id, tenantIdToUse);

    // User Provisioning Logic
    if (payload.password && client.email) {
      const existingUser = await prisma.user.findFirst({
        where: { email: client.email }
      });

      const roleId = client.clientType === 'SaaS' ? 14 : 13; // Default to SAAS_CLIENT or CUSTOMER

      if (!existingUser) {
        await userService.createUser({
          name: client.companyName || 'SaaS Client',
          email: client.email,
          password: payload.password,
          roleId: roleId,
          tenantId: client.tenantId || tenantIdToUse,
          status: 'Active'
        }, req.user.id, req.ip, req.headers['user-agent']);
      } else {
        const hashedPassword = await bcrypt.hash(payload.password, 10);
        await userService.updateUser(existingUser.id, {
          password: hashedPassword,
          deletedAt: null,
          status: 'Active'
        }, null, req.ip, req.headers['user-agent']);
      }
    }

    sendResponse(res, 201, 'Client created successfully', client);
  } catch (error) {
    next(error);
  }
};

export const getClients = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin && !req.query.tenantId ? null : (req.query.tenantId ? Number(req.query.tenantId) : req.user.tenantId);

    if (['BUSINESS_CLIENT', 'INDIVIDUAL_CLIENT'].includes(req.user.role?.name)) {
      req.query.id = req.user.clientId;
    }

    const result = await clientService.getClients(tenantIdToFilter, req.query);
    sendResponse(res, 200, 'Clients fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getClientById = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);

    const client = await clientService.getClientById(Number(req.params.id), tenantIdToFilter);
    sendResponse(res, 200, 'Client fetched successfully', client);
  } catch (error) {
    next(error);
  }
};

export const updateClient = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);

    const payload = req.body;

    // Safely extract and map ONLY the fields known to Prisma schema
    const clientData = {};
    if (payload.clientCode !== undefined) clientData.clientCode = payload.clientCode;
    if (payload.companyName !== undefined || payload.name !== undefined) clientData.companyName = payload.companyName || payload.name;
    if (payload.contactPerson !== undefined || payload.contact !== undefined) clientData.contactPerson = payload.contactPerson || payload.contact;
    if (payload.email !== undefined) clientData.email = payload.email;
    if (payload.phone !== undefined) clientData.phone = payload.phone;
    if (payload.address !== undefined || payload.location !== undefined) clientData.address = payload.address || payload.location;
    if (payload.city !== undefined) clientData.city = payload.city;
    if (payload.country !== undefined || payload.location !== undefined) clientData.country = payload.country || payload.location;
    if (payload.status !== undefined) clientData.status = payload.status;
    if (payload.clientType !== undefined || payload.client_type !== undefined) clientData.clientType = payload.clientType || payload.client_type;
    if (payload.billingCycle !== undefined || payload.billing_cycle !== undefined) clientData.billingCycle = payload.billingCycle || payload.billing_cycle;
    if (payload.paymentMethod !== undefined || payload.payment_method !== undefined) clientData.paymentMethod = payload.paymentMethod || payload.payment_method;
    if (payload.plan !== undefined) clientData.plan = payload.plan;
    if (payload.logoUrl !== undefined || payload.logo !== undefined) clientData.logoUrl = payload.logoUrl || payload.logo;
    if (payload.source !== undefined) clientData.source = payload.source;

    const updatedClient = await clientService.updateClient(Number(req.params.id), clientData, tenantIdToFilter, req.user.id);

    // User Provisioning Logic
    if (payload.password && updatedClient.email) {
      const existingUser = await prisma.user.findFirst({
        where: { email: updatedClient.email }
      });

      const roleId = updatedClient.clientType === 'SaaS' ? 14 : 13; // Default to SAAS_CLIENT or CUSTOMER

      if (existingUser) {
        const hashedPassword = await bcrypt.hash(payload.password, 10);
        await userService.updateUser(existingUser.id, {
          password: hashedPassword,
          deletedAt: null,
          status: 'Active'
        }, null, req.ip, req.headers['user-agent']);
      } else {
        await userService.createUser({
          name: updatedClient.companyName || 'SaaS Client',
          email: updatedClient.email,
          password: payload.password,
          roleId: roleId,
          tenantId: updatedClient.tenantId || 1,
          status: 'Active'
        }, req.user.id, req.ip, req.headers['user-agent']);
      }
    }

    sendResponse(res, 200, 'Client updated successfully', updatedClient);
  } catch (error) {
    next(error);
  }
};

export const deleteClient = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);

    await clientService.deleteClient(Number(req.params.id), tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Client deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const addClientContact = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToUse = isSuperAdmin ? null : req.user.tenantId;

    const contact = await clientService.addClientContact(Number(req.params.id), req.body, req.user.id, tenantIdToUse);
    sendResponse(res, 201, 'Client contact added successfully', contact);
  } catch (error) {
    next(error);
  }
};

export const removeClientContact = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToUse = isSuperAdmin ? null : req.user.tenantId;

    await clientService.removeClientContact(Number(req.params.id), Number(req.params.contactId), req.user.id, tenantIdToUse);
    sendResponse(res, 200, 'Client contact removed successfully');
  } catch (error) {
    next(error);
  }
};
