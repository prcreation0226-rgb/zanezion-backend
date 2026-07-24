import * as orderService from '../services/order.service.js';
import { sendResponse } from '../utils/response.js';
import prisma from '../config/db.js';
import { resolveTenantId } from '../utils/tenantResolver.js';



export const createOrder = async (req, res, next) => {
  try {
    // Normalize payload to handle both snake_case and camelCase
    let incomingClientId = req.body.clientId ?? req.body.customer_id;
    let incomingVendorId = req.body.vendorId ?? req.body.vendor_id;
    let incomingCompanyId = req.body.companyId ?? req.body.company_id;

    const isBusinessClient = req.user.role?.name === 'BUSINESS_CLIENT' || req.user.role?.name === 'CLIENT';
    const tenantIdToUse = req.body.tenantId ? Number(req.body.tenantId) : resolveTenantId(req);

    // Try to parse clientId from payload
    let parsedClientId = incomingClientId && incomingClientId !== "" ? Number(incomingClientId) : null;

    // If clientId is missing/invalid (e.g. customer user sending 'CLT-GUEST' or nothing),
    // auto-resolve from their user account via email → find or create a Client record.
    if (!parsedClientId || isNaN(parsedClientId) || parsedClientId <= 0) {
      const roleNameLower = (req.user.role?.name || '').toLowerCase();
      const isCustomerRole = ['customer', 'business_client', 'individual_client', 'guest', 'saas_client', 'client', 'unknown'].includes(roleNameLower);
      const isStaffRole = ['admin', 'operations', 'procurement', 'logistics', 'inventory', 'concierge', 'staff', 'super_admin', 'superadmin'].includes(roleNameLower);

      if (isCustomerRole) {
        // 1. Try to find an existing client linked by email
        let clientRecord = await prisma.client.findFirst({
          where: { email: req.user.email, tenantId: tenantIdToUse }
        });

        // 2. Fallback: find any client for this tenant with matching name
        if (!clientRecord && req.user.name) {
          clientRecord = await prisma.client.findFirst({
            where: { companyName: req.user.name, tenantId: tenantIdToUse }
          });
        }

        // 3. Auto-create a client record from their profile
        if (!clientRecord) {
          const clientCode = `CLT-${Date.now().toString().slice(-8)}`;
          clientRecord = await prisma.client.create({
            data: {
              tenantId: tenantIdToUse,
              companyName: req.user.name || req.user.email || 'Guest Client',
              clientCode,
              contactPerson: req.user.name || 'Guest',
              email: req.user.email || `guest-${Date.now()}@zanezion.com`,
              phone: req.user.phone || '0000000000',
              clientType: roleNameLower === 'customer' ? 'individual' : 'business',
              status: 'active',
            }
          });
        }

        parsedClientId = clientRecord.id;
      } else if (isStaffRole) {
        // Concierge / staff must explicitly select a client — provide a clear error message
        return res.status(400).json({
          success: false,
          message: "Please select a client to create this order",
          field: "clientId"
        });
      } else {
        // Unknown role — generic error
        return res.status(400).json({
          success: false,
          message: "Client selection is required",
          field: "clientId"
        });
      }
    }


    req.body.clientId = parsedClientId;

    // Safely parse vendorId and companyId
    req.body.vendorId = incomingVendorId && incomingVendorId !== "" ? Number(incomingVendorId) : null;
    req.body.companyId = incomingCompanyId && incomingCompanyId !== "" ? Number(incomingCompanyId) : null;

    // Remove old snake_case keys so Prisma doesn't crash on unknown args
    delete req.body.customer_id;
    delete req.body.vendor_id;
    delete req.body.company_id;

    const order = await orderService.createOrder(req.body, req.user.id, tenantIdToUse);
    sendResponse(res, 201, 'Order created successfully', order);
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    if (['INDIVIDUAL_CLIENT', 'CUSTOMER'].includes(req.user.role?.name?.toUpperCase())) {
      req.query.clientId = req.user.clientId;
    }

    const result = await orderService.getOrders(tenantIdToFilter, req.query);
    sendResponse(res, 200, 'Orders fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const order = await orderService.getOrderById(Number(req.params.id), tenantIdToFilter);
    sendResponse(res, 200, 'Order fetched successfully', order);
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const tenantIdToFilter = resolveTenantId(req);

    const updatedOrder = await orderService.updateOrderStatus(
      Number(req.params.id),
      status,
      tenantIdToFilter,
      req.user.id,
      remarks || null
    );
    sendResponse(res, 200, 'Order status updated successfully', updatedOrder);
  } catch (error) {
    next(error);
  }
};

export const getOrderTimeline = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);
    const order = await orderService.getOrderById(Number(req.params.id), tenantIdToFilter);

    const meta = typeof order.metadata === 'string' ? JSON.parse(order.metadata) : (order.metadata || {});
    const history = Array.isArray(meta.workflowHistory) ? meta.workflowHistory : [];

    // Enrich each entry with the mover's name by looking up userId
    const enriched = await Promise.all(history.map(async (entry) => {
      let moverName = `User #${entry.movedBy}`;
      try {
        const user = await prisma.user.findUnique({
          where: { id: Number(entry.movedBy) },
          select: { firstName: true, lastName: true, email: true }
        });
        if (user) moverName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      } catch (_) {}
      return { ...entry, moverName };
    }));

    sendResponse(res, 200, 'Order timeline fetched', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      currentDepartment: meta.currentDepartment || order.status,
      timeline: enriched
    });
  } catch (error) {
    next(error);
  }
};


export const updateOrder = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const updatedOrder = await orderService.updateOrder(Number(req.params.id), req.body, tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Order updated successfully', updatedOrder);
  } catch (error) {
    next(error);
  }
};

export const deleteOrder = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);
    const roleName = req.user.role?.name?.toUpperCase();
    const clientIdToFilter = ['INDIVIDUAL_CLIENT', 'CUSTOMER'].includes(roleName) ? req.user.clientId : null;

    await orderService.deleteOrder(Number(req.params.id), tenantIdToFilter, clientIdToFilter, req.user.id);
    sendResponse(res, 200, 'Order deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const tenantIdToUse = req.body.tenantId ? Number(req.body.tenantId) : resolveTenantId(req);

    // Resolve client id
      const incomingClientId = req.body.customerId || req.body.customer_id || req.body.companyId || req.body.company_id || req.body.clientUserId || req.body.client_user_id || req.body.clientId;
      const extractedClientId = typeof incomingClientId === 'string' && incomingClientId.includes('_') ? incomingClientId.split('_')[1] : incomingClientId;
      
      let clientId = extractedClientId && !isNaN(Number(extractedClientId)) ? Number(extractedClientId) : null;

      if (!clientId) {
        const clientName = req.body.client_name || req.body.client || req.body.name || "Default Project Client";
        // Try to find a client with this name
        let client = await prisma.client.findFirst({
           where: { tenantId: tenantIdToUse, companyName: { equals: clientName } }
        });
        
        if (!client) {
           // Fallback to any client for this tenant
           client = await prisma.client.findFirst({ where: { tenantId: tenantIdToUse } });
        }

        if (!client) {
           // Create a default client
           const clientCode = `CLT-${Date.now().toString().slice(-6)}`;
           client = await prisma.client.create({
              data: {
                 tenantId: tenantIdToUse,
                 companyName: clientName,
                 clientCode,
                 contactPerson: "Admin",
                 email: `admin-${Date.now()}@example.com`,
                 phone: "0000000000",
                 status: "active"
              }
           });
        }
        
        clientId = client.id;
      }

    // Fetch employee creator ID
    const employee = await prisma.employee.findUnique({ where: { userId: req.user.id } });
    const createdById = employee ? employee.id : 1; // Fallback to 1 if user is not employee

    // Generate unique order number (project code/name)
    const count = await prisma.order.count({ where: { tenantId: tenantIdToUse } });
    const orderNumber = `PRJ-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Extract metadata
    const metadata = {
      name: req.body.name,
      description: req.body.description,
      startDate: req.body.startDate || req.body.start,
      location: req.body.location,
      delivery_type: req.body.delivery_type || req.body.deliveryType || 'Road',
      client_name: req.body.client_name || req.body.client,
      companyId: req.body.companyId || req.body.company_id,
      customerId: req.body.customerId || req.body.customer_id,
      clientUserId: req.body.clientUserId || req.body.client_user_id
    };

    const project = await prisma.order.create({
      data: {
        tenantId: tenantIdToUse,
        orderNumber,
        clientId,
        createdById,
        status: req.body.status || 'planned',
        orderType: 'Project',
        totalAmount: 0,
        metadata
      }
    });

    // Format for frontend
    const formattedProject = {
      id: project.id,
      name: metadata.name,
      client: metadata.client_name,
      clientId: project.clientId,
      start: metadata.startDate,
      location: metadata.location,
      status: project.status,
      deliveryType: metadata.delivery_type,
      companyId: metadata.companyId || null,
      customerId: metadata.customerId || null,
      clientUserId: metadata.clientUserId || null
    };

    sendResponse(res, 201, 'Project created successfully', formattedProject);
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const where = {
      orderType: 'Project',
      ...(tenantIdToFilter !== null && { tenantId: tenantIdToFilter })
    };

    const projects = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { companyName: true, clientCode: true } }
      }
    });

    const formattedProjects = projects.map(project => {
      const metadataObj = typeof project.metadata === 'string' ? JSON.parse(project.metadata) : (project.metadata || {});
      return {
        id: project.id,
        name: metadataObj.name || project.orderNumber,
        client: metadataObj.client_name || project.client?.companyName || 'N/A',
        clientId: project.clientId,
        start: metadataObj.startDate || metadataObj.start || '',
        location: metadataObj.location || '',
        status: project.status,
        deliveryType: metadataObj.delivery_type || metadataObj.deliveryType || 'Road',
        companyId: metadataObj.companyId || null,
        customerId: metadataObj.customerId || null,
        clientUserId: metadataObj.clientUserId || null
      };
    });

    sendResponse(res, 200, 'Projects fetched successfully', formattedProjects);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const incomingClientId = req.body.customerId || req.body.customer_id || req.body.companyId || req.body.company_id || req.body.clientUserId || req.body.client_user_id || req.body.clientId;
    const extractedClientId = typeof incomingClientId === 'string' && incomingClientId.includes('_') ? incomingClientId.split('_')[1] : incomingClientId;
    const clientId = extractedClientId && !isNaN(Number(extractedClientId)) ? Number(extractedClientId) : undefined;

    // Fetch existing project to merge metadata
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing || existing.orderType !== 'Project') {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const existingMeta = typeof existing.metadata === 'string' ? JSON.parse(existing.metadata) : (existing.metadata || {});

    const metadata = {
      ...existingMeta,
      name: req.body.name || existingMeta.name,
      description: req.body.description || existingMeta.description,
      startDate: req.body.startDate || req.body.start || existingMeta.startDate,
      location: req.body.location || existingMeta.location,
      delivery_type: req.body.delivery_type || req.body.deliveryType || existingMeta.delivery_type,
      client_name: req.body.client_name || req.body.client || existingMeta.client_name,
      companyId: req.body.companyId || req.body.company_id || existingMeta.companyId,
      customerId: req.body.customerId || req.body.customer_id || existingMeta.customerId,
      clientUserId: req.body.clientUserId || req.body.client_user_id || existingMeta.clientUserId
    };

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(clientId && { clientId }),
        status: req.body.status || existing.status,
        metadata
      }
    });

    const formatted = {
      id: updated.id,
      name: metadata.name,
      client: metadata.client_name,
      clientId: updated.clientId,
      start: metadata.startDate,
      location: metadata.location,
      status: updated.status,
      deliveryType: metadata.delivery_type,
      companyId: metadata.companyId || null,
      customerId: metadata.customerId || null,
      clientUserId: metadata.clientUserId || null
    };

    sendResponse(res, 200, 'Project updated successfully', formatted);
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    // Find project
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing || existing.orderType !== 'Project') {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Delete project order
    await prisma.order.delete({ where: { id } });

    sendResponse(res, 200, 'Project archived successfully');
  } catch (error) {
    next(error);
  }
};

export const convertOrderToProject = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);
    const orderId = Number(req.params.orderId);

    const project = await orderService.convertOrderToProject(orderId, req.body, tenantIdToFilter, req.user.id);
    sendResponse(res, 201, 'Order converted to Project successfully', project);
  } catch (error) {
    next(error);
  }
};

