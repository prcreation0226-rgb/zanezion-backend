import * as clientService from '../services/client.service.js';
import * as userService from '../services/user.service.js';
import prisma from '../config/db.js';
import { sendResponse } from '../utils/response.js';

import { resolveTenantId, resolveTenantIdForSaasManagement } from '../utils/tenantResolver.js';

export const submitSaaSRequest = async (req, res, next) => {
  try {
    const payload = req.body;

    // Default tenant ID for public requests mapped to superadmin's tenant
    const defaultTenantId = 1;
    // Default system user id for public actions
    const systemUserId = 1;

    const clientData = {
      clientCode: `SAAS-${Date.now().toString().slice(-6)}`,
      companyName: payload.companyName || payload.clientName || "Unknown SaaS Client",
      contactPerson: payload.contactPerson || payload.contact || "Admin",
      email: payload.email,
      phone: payload.phone,
      country: payload.country || payload.location || null,
      status: "Pending", // Important: marks it as a pending request
      clientType: "SaaS",
      plan: payload.plan || null,
      source: "Subscriber"
    };

    const client = await clientService.createClient(clientData, systemUserId, defaultTenantId);

    // We send success true with data
    sendResponse(res, 201, 'SaaS Protocol initiated successfully', client);
  } catch (error) {
    next(error);
  }
};

export const provisionSaaSRequest = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const clientId = Number(req.params.id);
    const client = await clientService.getClientById(clientId, tenantIdToFilter);

    if (client.status === 'Provisioned' || client.status === 'Active') {
      return sendResponse(res, 400, 'Client is already provisioned');
    }

    // Provisioning: Create/Find Organization -> Tenant -> User
    let org = await prisma.organization.findUnique({
      where: { email: client.email }
    });

    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: client.companyName || 'SaaS Client',
          email: client.email || `saas_${Date.now()}@example.com`,
          phone: client.phone,
          country: client.country
        }
      });
    }

    const tenant = await prisma.tenant.create({
      data: {
        organizationId: org.id,
        tenantCode: `T-${Date.now().toString().slice(-6)}`,
        status: 'active'
      }
    });

    const saasRole = await prisma.role.findUnique({ where: { name: 'SAAS_CLIENT' } });
    if (!saasRole) {
      return sendResponse(res, 500, 'System configuration error: SAAS_CLIENT role missing');
    }

    // Create the SaaS Admin user
    await userService.createUser({
      name: client.contactPerson || 'Admin',
      email: client.email,
      password: req.body.password || "Password123!", // Use the password provided by Super Admin
      roleId: saasRole.id, // Dynamically fetched SAAS_CLIENT role
      tenantId: tenant.id
    }, req.user.id, req.ip, req.headers['user-agent']);

    // Update the status to Provisioned
    const clientData = {
      status: "Provisioned"
    };

    const updatedClient = await clientService.updateClient(clientId, clientData, tenantIdToFilter, req.user.id);

    sendResponse(res, 200, 'SaaS Protocol provisioned successfully', updatedClient);
  } catch (error) {
    next(error);
  }
};

export const getSaaSRequests = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantIdForSaasManagement(req);

    // Get all clients that are SaaS and Pending
    const query = {
      clientType: "SaaS",
      status: "Pending"
    };

    const result = await clientService.getClients(tenantIdToFilter, query);
    sendResponse(res, 200, 'SaaS Requests fetched successfully', result);
  } catch (error) {
    next(error);
  }
};
