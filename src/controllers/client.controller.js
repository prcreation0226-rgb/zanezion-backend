import * as clientService from '../services/client.service.js';
import * as userService from '../services/user.service.js';
import { sendResponse } from '../utils/response.js';
import prisma from '../config/db.js';
import bcrypt from 'bcrypt';
import { resolveTenantId, resolveTenantIdForSaasManagement } from '../utils/tenantResolver.js';

export const createClient = async (req, res, next) => {
  try {
    let tenantIdToUse = req.body.tenantId ? Number(req.body.tenantId) : resolveTenantId(req);

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

    // User Provisioning & Plan Sync Logic
    if (client.email) {
      const existingUser = await prisma.user.findFirst({
        where: { email: client.email }
      });

      const roleId = client.clientType === 'SaaS' ? 14 : 13; // Default to SAAS_CLIENT or CUSTOMER
      const isPaidPlan = payload.plan && payload.plan.toLowerCase() !== 'free';

      if (!existingUser && payload.password) {
        await userService.createUser({
          name: client.companyName || 'Client User',
          email: client.email,
          password: payload.password,
          roleId: roleId,
          tenantId: client.tenantId || tenantIdToUse,
          plan: payload.plan || 'Free',
          is_upgraded: isPaidPlan,
          concierge_member: isPaidPlan,
          concierge_membership_since: isPaidPlan ? new Date().toISOString().slice(0, 10) : null,
          status: 'Active'
        }, req.user.id, req.ip, req.headers['user-agent']);
      } else if (existingUser) {
        await userService.updateUser(existingUser.id, {
          ...(payload.password && { password: payload.password }),
          plan: payload.plan || existingUser.plan,
          is_upgraded: isPaidPlan,
          concierge_member: isPaidPlan,
          concierge_membership_since: isPaidPlan ? (existingUser.concierge_membership_since || new Date().toISOString().slice(0, 10)) : null,
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
    const rawRole = typeof req.user?.role === 'string' ? req.user.role : (req.user?.role?.name || req.user?.roleName || '');
    const roleName = String(rawRole).toUpperCase();
    const userTenant = req.user?.tenantId ? Number(req.user.tenantId) : 1;
    const isHQSuperAdmin = (roleName === 'SUPER_ADMIN' || roleName === 'SUPERADMIN' || req.user?.roleId === 1) && userTenant === 1;

    let tenantIdToFilter = resolveTenantId(req);
    if (isHQSuperAdmin) {
      if (req.query?.tenantId) {
        tenantIdToFilter = Number(req.query.tenantId);
      } else {
        tenantIdToFilter = null; // HQ Super Admin can view across all tenants if no specific tenant requested
      }
    }

    if (['INDIVIDUAL_CLIENT', 'CUSTOMER'].includes(roleName)) {
      let resolvedClientId = req.user.clientId;
      if (!resolvedClientId) {
        const clientRec = await prisma.client.findFirst({
          where: {
            OR: [
              { email: req.user.email },
              { companyName: req.user.name || '' }
            ]
          }
        });
        if (clientRec) resolvedClientId = clientRec.id;
      }
      if (resolvedClientId) {
        req.query.id = resolvedClientId;
      }
    }

    const result = await clientService.getClients(tenantIdToFilter, req.query);
    sendResponse(res, 200, 'Clients fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getClientById = async (req, res, next) => {
  try {
    const rawRole = typeof req.user.role === 'string' ? req.user.role : (req.user.role?.name || req.user.roleName || '');
    const isSuperAdmin = String(rawRole).toUpperCase() === 'SUPER_ADMIN' || req.user.roleId === 1;

    let tenantIdToFilter = resolveTenantId(req);
    if (isSuperAdmin) {
      tenantIdToFilter = null;
    }

    const client = await clientService.getClientById(Number(req.params.id), tenantIdToFilter);
    sendResponse(res, 200, 'Client fetched successfully', client);
  } catch (error) {
    next(error);
  }
};

export const updateClient = async (req, res, next) => {
  try {
    const rawRole = typeof req.user.role === 'string' ? req.user.role : (req.user.role?.name || req.user.roleName || '');
    const isSuperAdmin = String(rawRole).toUpperCase() === 'SUPER_ADMIN' || req.user.roleId === 1;

    let tenantIdToFilter = resolveTenantId(req);
    if (isSuperAdmin) {
      tenantIdToFilter = null;
    }

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

    // User Provisioning & Plan Sync Logic
    if (updatedClient.email) {
      const existingUser = await prisma.user.findFirst({
        where: { email: updatedClient.email }
      });

      const roleId = updatedClient.clientType === 'SaaS' ? 14 : 13; // Default to SAAS_CLIENT or CUSTOMER
      const isPaidPlan = payload.plan && payload.plan.toLowerCase() !== 'free';

      if (existingUser) {
        await userService.updateUser(existingUser.id, {
          ...(payload.password && { password: payload.password }),
          plan: payload.plan !== undefined ? payload.plan : existingUser.plan,
          is_upgraded: isPaidPlan,
          concierge_member: isPaidPlan,
          concierge_membership_since: isPaidPlan ? (existingUser.concierge_membership_since || new Date().toISOString().slice(0, 10)) : null,
          deletedAt: null,
          status: 'Active'
        }, null, req.ip, req.headers['user-agent']);
      } else if (payload.password) {
        await userService.createUser({
          name: updatedClient.companyName || 'Client User',
          email: updatedClient.email,
          password: payload.password,
          roleId: roleId,
          tenantId: updatedClient.tenantId || 1,
          plan: payload.plan || 'Free',
          is_upgraded: isPaidPlan,
          concierge_member: isPaidPlan,
          concierge_membership_since: isPaidPlan ? new Date().toISOString().slice(0, 10) : null,
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
    const rawRole = typeof req.user.role === 'string' ? req.user.role : (req.user.role?.name || req.user.roleName || '');
    const roleName = String(rawRole).toUpperCase();
    const isSuperAdmin = roleName === 'SUPER_ADMIN' || req.user.roleId === 1;

    let tenantIdToFilter = resolveTenantId(req);
    if (isSuperAdmin) {
      tenantIdToFilter = null;
    }

    await clientService.deleteClient(Number(req.params.id), tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Client deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const addClientContact = async (req, res, next) => {
  try {
    const tenantIdToUse = resolveTenantId(req);

    const contact = await clientService.addClientContact(Number(req.params.id), req.body, req.user.id, tenantIdToUse);
    sendResponse(res, 201, 'Client contact added successfully', contact);
  } catch (error) {
    next(error);
  }
};

export const removeClientContact = async (req, res, next) => {
  try {
    const tenantIdToUse = resolveTenantId(req);

    await clientService.removeClientContact(Number(req.params.id), Number(req.params.contactId), req.user.id, tenantIdToUse);
    sendResponse(res, 200, 'Client contact removed successfully');
  } catch (error) {
    next(error);
  }
};
