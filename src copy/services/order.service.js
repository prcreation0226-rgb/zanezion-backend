import * as orderRepo from '../repositories/order.repository.js';
import * as clientRepo from '../repositories/client.repository.js';
import * as employeeRepo from '../repositories/employee.repository.js';
import prisma from '../config/db.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';

// --- Order Reservation Engine ---

const validateAndReserveStock = async (tx, items) => {
  const itemsArray = items || [];
  for (const item of itemsArray) {
    const stock = await tx.inventoryStock.findUnique({
      where: { warehouseId_itemId: { warehouseId: item.warehouseId, itemId: item.itemId } }
    });

    if (!stock) {
      throw new AppError(`Stock record not found for Item ${item.itemId} in Warehouse ${item.warehouseId}`, 400);
    }

    const availableQuantity = stock.quantity - stock.reservedQuantity;
    if (availableQuantity < item.quantity) {
      throw new AppError(`Insufficient stock for Item ${item.itemId}. Available: ${availableQuantity}, Requested: ${item.quantity}`, 400);
    }

    // Reserve stock
    await tx.inventoryStock.update({
      where: { id: stock.id },
      data: { reservedQuantity: { increment: item.quantity } }
    });
  }
};

const releaseReservedStock = async (tx, items) => {
  const itemsArray = items || [];
  for (const item of itemsArray) {
    const stock = await tx.inventoryStock.findUnique({
      where: { warehouseId_itemId: { warehouseId: item.warehouseId, itemId: item.itemId } }
    });

    if (stock) {
      // Ensure we don't drop below 0 by releasing too much (sanity check)
      const decrementVal = Math.min(stock.reservedQuantity, item.quantity);
      await tx.inventoryStock.update({
        where: { id: stock.id },
        data: { reservedQuantity: { decrement: decrementVal } }
      });
    }
  }
};

// --- Order Methods ---

export const createOrder = async (data, performerId, tenantId) => {
  const { items, ...orderData } = data;

  const validOrderItems = [];
  const customItems = [];

  if (items && Array.isArray(items)) {
    for (const item of items) {
      if (item.itemId && item.warehouseId) {
        validOrderItems.push({
            itemId: Number(item.itemId),
            warehouseId: Number(item.warehouseId),
            quantity: Number(item.quantity || item.qty || 1),
            unitPrice: Number(item.unitPrice || item.price || 0)
        });
      } else {
        customItems.push(item);
      }
    }
  }

  if (customItems.length > 0) {
    orderData.metadata = {
      ...(orderData.metadata || {}),
      customItems
    };
  }

  const client = await clientRepo.findClientById(data.clientId);
  
  // Detailed logging as requested
  console.log(`[Order Creation] Received clientId: ${data.clientId}, tenantId: ${tenantId}`);
  console.log(`[Order Creation] Prisma query result:`, client ? `Found (ID: ${client.id}, Tenant: ${client.tenantId}, Status: ${client.status})` : 'Null');

  if (!client) {
    throw new AppError('Selected client does not exist', 404);
  }

  // Filter out soft-deleted or inactive clients
  if (client.status === 'deleted' || client.status === 'inactive') {
    throw new AppError('Selected client does not exist', 404);
  }

  // Ensure strict tenant isolation using Number casting to prevent type mismatch (string vs int)
  if (tenantId !== null && Number(client.tenantId) !== Number(tenantId)) {
    console.error(`[Order Creation] Tenant mismatch! Client belongs to ${client.tenantId}, request from ${tenantId}`);
    throw new AppError('Selected client does not exist', 404);
  }

  const employee = await prisma.employee.findUnique({ where: { userId: performerId } });
  
  orderData.createdById = employee ? employee.id : 1;
  orderData.status = data.status || orderData.status || 'draft';

  const newOrder = await orderRepo.createOrder(orderData, validOrderItems, tenantId);

  await logAudit({
    module: 'ORDERS',
    action: 'CREATE',
    description: `Created Order ${newOrder.orderNumber} for Client ${client.companyName}`,
    newValue: newOrder,
    performedBy: performerId
  });

  return newOrder;
};

export const getOrders = async (tenantId, query) => {
  return await orderRepo.findAllOrders(tenantId, query);
};

export const getOrderById = async (id, tenantId) => {
  const order = await orderRepo.findOrderById(id);
  if (!order || (tenantId !== null && order.tenantId !== tenantId)) {
    throw new AppError('Order not found', 404);
  }
  return order;
};

export const updateOrderStatus = async (id, status, tenantId, performerId) => {
  const order = await getOrderById(id, tenantId);

  if (order.status === 'cancelled') {
    throw new AppError('Cannot update a cancelled order', 400);
  }

  // Removed strict validTransitions check to allow flexible workflow statuses (e.g. admin_review, concierge) from GlobalDataContext

  let updatedOrder;

  await prisma.$transaction(async (tx) => {
    // If transitioning TO approved, Reserve Stock
    if (status === 'approved') {
      await validateAndReserveStock(tx, order.items);
    }

    // If transitioning FROM approved TO cancelled, Release Stock
    if (order.status === 'approved' && status === 'cancelled') {
      await releaseReservedStock(tx, order.items);
    }

    // Update the actual order status
    updatedOrder = await tx.order.update({
      where: { id },
      data: { status }
    });
  });

  await logAudit({
    module: 'ORDERS',
    action: 'STATUS_CHANGE',
    description: `Order ${order.orderNumber} status changed to ${status}`,
    oldValue: order,
    newValue: updatedOrder,
    performedBy: performerId
  });

  const { metadata, ...rest } = updatedOrder;
  const metadataObj = typeof metadata === 'string' ? JSON.parse(metadata) : (metadata || {});
  return {
    ...rest,
    metadata: metadataObj,
    ...metadataObj
  };
};

export const updateOrder = async (id, data, tenantId, performerId) => {
  const order = await getOrderById(id, tenantId);
  const { items, ...orderData } = data;
  const customItems = [];
  if (items && Array.isArray(items)) {
    for (const item of items) {
      if (!item.itemId || !item.warehouseId) {
        customItems.push(item);
      }
    }
  }

  // clientId is handled via Prisma relation (client connect), not as a raw field
  const validDbKeys = [
    'id', 'tenantId', 'orderNumber', 'createdById',
    'status', 'priority', 'orderType', 'totalAmount'
  ];

  const dbData = {};
  const metadataExt = {};

  Object.keys(orderData).forEach(key => {
    if (key === 'clientId') return; // handled separately below
    if (validDbKeys.includes(key)) {
      dbData[key] = orderData[key];
    } else {
      metadataExt[key] = orderData[key];
    }
  });

  // Safely update client relation only when a valid numeric clientId is provided
  const rawClientId = orderData.clientId;
  const parsedClientId = rawClientId && rawClientId !== 'CLT-GUEST' ? Number(rawClientId) : NaN;
  if (!isNaN(parsedClientId) && parsedClientId > 0) {
    dbData.client = { connect: { id: parsedClientId } };
  }
  // else: keep existing client — do not touch the relation

  if (data.totalAmount !== undefined || data.total_amount !== undefined) {
    dbData.totalAmount = Number(data.totalAmount || data.total_amount || 0);
  }

  let metadataObj = typeof order.metadata === 'string' ? JSON.parse(order.metadata) : (order.metadata || {});
  
  if (customItems.length > 0) {
    metadataExt.customItems = customItems;
  }

  const finalMetadata = {
    ...metadataObj,
    ...metadataExt
  };

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: {
      ...dbData,
      status: data.status || order.status,
      metadata: finalMetadata
    }
  });
  
  const { metadata, ...rest } = updatedOrder;
  return {
    ...rest,
    metadata: finalMetadata,
    ...finalMetadata
  };
};

export const deleteOrder = async (id, tenantId, performerId) => {
  const order = await getOrderById(id, tenantId);



  await orderRepo.deleteOrder(id);

  await logAudit({
    module: 'ORDERS',
    action: 'DELETE',
    description: `Deleted Order ${order.orderNumber}`,
    oldValue: order,
    performedBy: performerId
  });

  return true;
};

export const convertOrderToProject = async (orderId, projectData, tenantId, performerId) => {
  const order = await getOrderById(orderId, tenantId);

  // Generate unique order number
  const count = await prisma.order.count({ where: { tenantId: order.tenantId } });
  const orderNumber = `PRJ-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

  const employee = await prisma.employee.findUnique({ where: { userId: performerId } });
  const createdById = employee ? employee.id : 1;

  // Extract client name
  const client = await clientRepo.findClientById(order.clientId);
  const clientName = client ? client.companyName : 'N/A';

  const metadata = {
    name: projectData.name || `Project for Order #${order.orderNumber}`,
    description: projectData.description || order.notes || '',
    startDate: projectData.startDate || projectData.start || new Date().toISOString().split('T')[0],
    location: projectData.location || order.location || '',
    delivery_type: projectData.delivery_type || projectData.deliveryType || 'Road',
    client_name: clientName
  };

  const project = await prisma.order.create({
    data: {
      tenantId: order.tenantId,
      orderNumber,
      clientId: order.clientId,
      createdById,
      status: projectData.status || 'planned',
      orderType: 'Project',
      totalAmount: order.totalAmount || 0,
      metadata
    }
  });

  await logAudit({
    module: 'ORDERS',
    action: 'CREATE',
    description: `Converted Order ${order.orderNumber} to Project ${project.orderNumber}`,
    newValue: project,
    performedBy: performerId
  });

  return {
    id: project.id,
    name: metadata.name,
    client: metadata.client_name,
    clientId: project.clientId,
    start: metadata.startDate,
    location: metadata.location,
    status: project.status,
    deliveryType: metadata.delivery_type,
    companyId: order.companyId || null,
    customerId: order.clientId || null,
    clientUserId: null
  };
};

