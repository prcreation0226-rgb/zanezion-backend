import prisma from '../config/db.js';

const generateOrderNumber = async (tenantId) => {
  const lastOrder = await prisma.order.findFirst({
    orderBy: { id: 'desc' }
  });
  const nextNum = lastOrder ? lastOrder.id + 1 : 1;
  return `ORD-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`;
};

export const createOrder = async (data, items, tenantId, tx = null) => {
  const clientToUse = tx || prisma;
  const resolvedTenantId = (tenantId != null && !isNaN(Number(tenantId))) ? Number(tenantId) : (data.tenantId != null ? Number(data.tenantId) : 1);
  const orderNumber = data.orderNumber || await generateOrderNumber(resolvedTenantId);
  
  const itemsArray = items || [];
  let computedTotalAmount = itemsArray.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  
  // If no explicit DB items but we have a total amount in data, use it
  if (computedTotalAmount === 0 && (data.totalAmount !== undefined || data.total_amount !== undefined)) {
      computedTotalAmount = Number(data.totalAmount || data.total_amount || 0);
  }

  const validDbKeys = [
    'id',
    'tenantId',
    'orderNumber',
    'clientId',
    'createdById',
    'status',
    'priority',
    'orderType',
    'metadata',
    'totalAmount',
    'createdAt',
    'updatedAt'
  ];

  const dbData = {};
  const metadataExt = {};

  Object.keys(data).forEach(key => {
    if (validDbKeys.includes(key)) {
      dbData[key] = data[key];
    } else {
      metadataExt[key] = data[key];
    }
  });

  const existingMetadata = typeof data.metadata === 'string'
    ? JSON.parse(data.metadata)
    : (data.metadata || {});

  const finalMetadata = {
    ...existingMetadata,
    ...metadataExt
  };

  const dbOrderItems = itemsArray.filter(item => item && item.itemId && !isNaN(Number(item.itemId)) && Number(item.itemId) > 0).map(item => ({
    itemId: Number(item.itemId),
    warehouseId: Number(item.warehouseId || 1),
    quantity: Number(item.quantity || 1),
    unitPrice: Number(item.unitPrice || 0),
    totalPrice: Number(item.totalPrice != null ? item.totalPrice : ((item.quantity || 1) * (item.unitPrice || 0))),
    tenantId: resolvedTenantId
  }));

  const newOrder = await clientToUse.order.create({
    data: {
      ...dbData,
      orderNumber,
      tenantId: resolvedTenantId,
      totalAmount: computedTotalAmount,
      metadata: finalMetadata,
      ...(dbOrderItems.length > 0 && {
        items: {
          create: dbOrderItems
        }
      })
    },
    include: { items: true, client: true }
  });

  const { metadata, ...rest } = newOrder;
  return {
    ...finalMetadata,
    ...rest,
    metadata: finalMetadata
  };
};

export const findOrderById = async (id) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { item: true } },
      client: true,
      creator: { select: { firstName: true, lastName: true } }
    }
  });
  if (!order) return null;
  const { metadata, ...rest } = order;
  const metadataObj = typeof metadata === 'string' ? JSON.parse(metadata) : (metadata || {});
  return {
    ...metadataObj,
    ...rest,
    metadata: metadataObj
  };
};

export const findAllOrders = async (tenantId, query) => {
  const { page = 1, limit = 10, search = '', status, clientId, user_id, customer_email, orderType, currentDept, passedThrough } = query;
  const skip = (page - 1) * limit;

  const isCustomerFilter = !!(user_id || customer_email);
  const where = {
    ...(tenantId !== null && tenantId !== undefined && { tenantId }),
    ...(search && { orderNumber: { contains: search } }),
    ...(status && { status }),
    ...(!isCustomerFilter && clientId && { clientId: Number(clientId) }),
    ...(orderType && {
      OR: [
        { orderType: orderType },
        { orderType: String(orderType).toLowerCase() },
        { orderType: String(orderType).toUpperCase() }
      ]
    })
  };

  // currentDept: orders currently in this department (metadata.currentDepartment)
  // passedThrough: orders that previously passed through this department (in workflowHistory)
  // These are applied post-query since they depend on JSON fields
  let applyCurrentDeptFilter = currentDept ? String(currentDept).toLowerCase() : null;
  let applyPassedThroughFilter = passedThrough ? String(passedThrough).toLowerCase() : null;

  // Fetch all matching orders first (we post-filter JSON metadata fields)
  const allOrders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      items: { include: { item: true } },
      client: { select: { id: true, companyName: true, clientCode: true, contactPerson: true, email: true, plan: true, clientType: true, status: true } }
    }
  });

  let mappedOrders = allOrders.map(o => {
    const { metadata, ...rest } = o;
    const metadataObj = typeof metadata === 'string' ? JSON.parse(metadata) : (metadata || {});
    const itemsArr = (o.items && o.items.length > 0)
      ? o.items
      : (Array.isArray(metadataObj.customItems) ? metadataObj.customItems : []);

    return {
      ...metadataObj,
      ...rest,
      items: itemsArr,
      metadata: metadataObj
    };
  });

  // For Concierge role queries, enforce Concierge Order Visibility Rule:
  // - Concierge Requests/Orders: ALWAYS visible
  // - Marketplace Orders: Visible ONLY for clients with upgraded accounts in database
  const isConciergeViewer = query.viewerRole === 'concierge' || query.role === 'concierge';
  if (isConciergeViewer) {
    mappedOrders = mappedOrders.filter(o => {
      const typeStr = String(o.orderType || o.type || '').toUpperCase();
      const kindStr = String(o.orderKind || o.kind || '').toLowerCase();
      const statusStr = String(o.status || '').toLowerCase();
      const meta = o.metadata || {};

      const isConciergeReq =
        typeStr.includes('CONCIERGE') || typeStr.includes('CHAUFFEUR') || typeStr.includes('EVENTS') || typeStr.includes('BESPOKE') || typeStr.includes('VIP') ||
        kindStr.includes('custom') || kindStr.includes('bespoke') || kindStr.includes('concierge') || kindStr.includes('chauffeur') ||
        statusStr === 'concierge' || meta.custom_request_category || o.isConcierge || o.isCustomRequest;

      if (isConciergeReq) return true;

      // For marketplace orders, check if client account is upgraded in database
      const client = o.client;
      if (!client) return false;
      const planStr = String(client.plan || '').toLowerCase();
      const typeStrClient = String(client.clientType || '').toLowerCase();
      const upgradedKeywords = ['upgraded', 'vip', 'saas', 'enterprise', 'corporate', 'pro', 'concierge', 'lifestyle', 'membership', 'premium', 'business'];

      return upgradedKeywords.some(kw => planStr.includes(kw) || typeStrClient.includes(kw));
    });
  }

  // For customer queries, ensure orders matching customer's user_id, email, or clientId are included
  if (isCustomerFilter) {
    const filterClientId = clientId ? String(clientId) : null;
    const filterUserId = user_id ? String(user_id) : null;
    const filterEmail = customer_email ? String(customer_email).toLowerCase().trim() : null;

    mappedOrders = mappedOrders.filter(o => {
      const oClientId = String(o.clientId || o.client_id || '');
      const oUserId = String(o.customer_id || o.created_by || o.createdById || o.userId || o.user_id || o.metadata?.userId || o.metadata?.user_id || o.metadata?.customer_id || o.metadata?.created_by || '');
      const oEmail = String(o.email || o.client_email || o.customer_email || o.metadata?.email || o.metadata?.user_email || o.metadata?.customer_email || '').toLowerCase().trim();

      if (filterUserId && oUserId && oUserId === filterUserId) return true;
      if (filterClientId && oClientId && oClientId === filterClientId) return true;
      if (filterEmail && oEmail && oEmail === filterEmail) return true;

      return false;
    });
  }

  // Post-filter by department (JSON metadata fields + status aliases)
  if (applyCurrentDeptFilter) {
    mappedOrders = mappedOrders.filter(o => {
      const metaDept = String(o.metadata?.currentDepartment || o.metadata?.routed_department || o.metadata?.route_department || '').toLowerCase();
      if (metaDept && metaDept === applyCurrentDeptFilter) return true;

      const rawStatus = String(o.status || '').toLowerCase();
      if (applyCurrentDeptFilter === 'admin' && ['admin', 'admin_review', 'pending_review', 'draft'].includes(rawStatus)) return true;
      if (applyCurrentDeptFilter === 'operations' && ['operations', 'submitted', 'review', 'approved', 'ready_for_delivery'].includes(rawStatus)) return true;
      if (applyCurrentDeptFilter === 'procurement' && ['procurement', 'purchase_requested'].includes(rawStatus)) return true;
      if (applyCurrentDeptFilter === 'inventory' && ['inventory', 'stock_reserved'].includes(rawStatus)) return true;
      if (applyCurrentDeptFilter === 'logistics' && ['logistics', 'dispatched', 'in_transit'].includes(rawStatus)) return true;
      if (applyCurrentDeptFilter === 'concierge' && ['concierge'].includes(rawStatus)) return true;

      return rawStatus === applyCurrentDeptFilter;
    });
  }
  if (applyPassedThroughFilter) {
    mappedOrders = mappedOrders.filter(o => {
      const history = Array.isArray(o.metadata?.workflowHistory) ? o.metadata.workflowHistory : [];
      return history.some(h => String(h.department || '').toLowerCase() === applyPassedThroughFilter);
    });
  }

  // Paginate after filtering
  const total = mappedOrders.length;
  const paginated = mappedOrders.slice((Number(page) - 1) * Number(limit), (Number(page) - 1) * Number(limit) + Number(limit));

  return { orders: paginated, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
};

export const updateOrderStatus = async (id, status, newMetadata) => {
  const updatedOrder = await prisma.order.update({
    where: { id },
    data: {
      status,
      ...(newMetadata !== undefined && { metadata: newMetadata })
    }
  });
  if (!updatedOrder) return null;
  const { metadata, ...rest } = updatedOrder;
  const metadataObj = typeof metadata === 'string' ? JSON.parse(metadata) : (metadata || {});
  return {
    ...rest,
    metadata: metadataObj,
    ...metadataObj
  };
};

export const deleteOrder = async (id) => {
  return await prisma.order.delete({ where: { id } });
};
