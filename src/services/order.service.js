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

  let client = null;
  if (data.clientId) {
    const cid = Number(data.clientId);
    if (!isNaN(cid)) {
      client = await clientRepo.findClientById(cid);
      if (!client) {
        client = await prisma.client.findFirst({
          where: {
            OR: [
              { id: cid },
              { userId: cid }
            ]
          }
        });
      }
    }
  }

  // If still no client found, try finding client matching performerId (logged in user)
  if (!client && performerId) {
    const user = await prisma.user.findUnique({ where: { id: Number(performerId) } });
    if (user && user.email) {
      client = await prisma.client.findFirst({
        where: { email: user.email }
      });
      // If client profile doesn't exist for this user, auto-create a dedicated client record with user's real name
      if (!client) {
        const clientCode = `CLT-${Date.now().toString().slice(-6)}`;
        client = await prisma.client.create({
          data: {
            tenantId: tenantId || 1,
            clientCode,
            companyName: user.name ? (user.name.includes('(Personal Client)') ? user.name : `${user.name} (Personal Client)`) : (data.client || 'Personal Client'),
            contactPerson: user.name || 'Personal Client',
            email: user.email,
            phone: user.phone || 'N/A',
            status: 'active',
            clientType: 'Personal'
          }
        });
      }
    }
  }

  if (!client) {
    client = await prisma.client.findFirst({ where: { status: 'active' } }) || await prisma.client.findFirst();
  }

  if (!client) {
    throw new AppError('Selected client does not exist', 404);
  }

  orderData.clientId = client.id;
  const orderTenantId = client ? Number(client.tenantId) : (tenantId || 1);

  // Auto-resolve default warehouse if missing on items
  let defaultWarehouse = await prisma.warehouse.findFirst({ where: { tenantId: orderTenantId } });
  if (!defaultWarehouse) {
    defaultWarehouse = await prisma.warehouse.findFirst();
  }

  const validOrderItems = [];
  const customItems = [];

  if (items && Array.isArray(items)) {
    for (const item of items) {
      const rawItemId = item.itemId || item.id;
      const parsedItemId = rawItemId != null && !isNaN(Number(rawItemId)) ? Number(rawItemId) : null;
      const rawWhId = item.warehouseId || item.warehouse_id;
      const parsedWhId = rawWhId != null && !isNaN(Number(rawWhId)) ? Number(rawWhId) : (defaultWarehouse?.id || 1);

      let dbItemExists = false;
      if (parsedItemId) {
        const dbItem = await prisma.item.findUnique({ where: { id: parsedItemId } });
        if (dbItem) dbItemExists = true;
      }

      if (parsedItemId && parsedWhId && dbItemExists) {
        validOrderItems.push({
          itemId: parsedItemId,
          warehouseId: parsedWhId,
          quantity: Number(item.quantity || item.qty || 1),
          unitPrice: Number(item.unitPrice || item.price || 0)
        });
      } else {
        customItems.push(item);
      }
    }
  }

  const existingMeta = typeof orderData.metadata === 'string'
    ? (JSON.parse(orderData.metadata) || {})
    : (orderData.metadata || {});

  const passedTotal = Number(
    data.totalAmount ||
    data.total_amount ||
    data.total ||
    data.estimated_total ||
    data.amount ||
    data.chauffeurFee ||
    data.chauffeur_fee ||
    data.fee ||
    existingMeta.chauffeurFee ||
    existingMeta.chauffeur_fee ||
    existingMeta.total_amount ||
    (customItems[0] && (customItems[0].chauffeurFee || customItems[0].chauffeur_fee || customItems[0].price || customItems[0].total)) ||
    0
  );

  const isChauffeurOrder = String(orderData.orderType || data.type || '').toUpperCase() === 'CHAUFFEUR';
  const isMarketplaceOrder = ['MARKETPLACE', 'MARKET_ORDER', 'CUSTOM', 'PURCHASE'].includes(String(orderData.orderType || data.type || '').toUpperCase());
  if (isChauffeurOrder) {
    const sType = data.serviceType || existingMeta.serviceType || 'One Way';
    const days = parseInt(data.numberOfDays || data.dailyDays || existingMeta.numberOfDays || existingMeta.dailyDays || 1, 10) || 1;
    const qtyMultiplier = sType === 'Round Trip' ? 2 : (sType === 'Daily Service' ? days : 1);
    const baseUnitPrice = Number(data.unitPrice || data.price || existingMeta.unitPrice || 120) || 120;
    const computedChauffeurTotal = baseUnitPrice * qtyMultiplier;

    if (!passedTotal || (sType === 'Daily Service' && days > 1 && passedTotal <= baseUnitPrice * 1.5) || (sType === 'Round Trip' && passedTotal <= baseUnitPrice * 1.5)) {
      orderData.totalAmount = computedChauffeurTotal;
    } else {
      orderData.totalAmount = passedTotal;
    }
  } else if (validOrderItems.length > 0) {
    const calcTotal = validOrderItems.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0);
    orderData.totalAmount = calcTotal > 0 ? calcTotal : passedTotal;
  } else {
    orderData.totalAmount = passedTotal;
  }

  const metaCustomItems = Array.isArray(existingMeta.customItems) ? existingMeta.customItems : [];
  const itemsToSave = customItems.length > 0 ? customItems : (items || []);
  const customItem = (customItems && customItems[0]) || (items && items[0]) || (existingMeta && existingMeta.customItems && existingMeta.customItems[0]) || {};

  // Determine client name fallback for guestName / passengerName if not explicitly provided
  const resolvedClientName = client ? (client.companyName || client.contactPerson || client.name) : (orderData.clientName || 'Guest Client');
  const rawPassengerName = data.passengerName || data.passenger_name || data.guestName || data.guest_name || customItem.passengerName || customItem.passenger_name || customItem.guestName || customItem.guest_name || existingMeta.passengerName || existingMeta.guestName;
  const passengerName = (rawPassengerName && String(rawPassengerName).trim() && String(rawPassengerName).toLowerCase() !== 'personal client')
    ? String(rawPassengerName).trim()
    : (resolvedClientName && resolvedClientName.toLowerCase() !== 'personal client' ? resolvedClientName : (customItem.passengerName || customItem.guestName || rawPassengerName || resolvedClientName));

  const numberOfPassengers = Number(data.numberOfPassengers || data.passengers || data.passengerCount || customItem.numberOfPassengers || customItem.passengers || customItem.passengerCount || existingMeta.numberOfPassengers || existingMeta.passengers || 1);
  const rawAmenities = data.amenities || customItem.amenities || existingMeta.amenities || [];
  const amenitiesArray = Array.isArray(rawAmenities)
    ? rawAmenities
    : (typeof rawAmenities === 'string' && rawAmenities.trim() ? rawAmenities.split(',').map(s => s.trim()) : []);

  const amenitiesLower = amenitiesArray.map(a => String(a).toLowerCase());
  const wifi = (data.wifi === 'Yes' || customItem.wifi === 'Yes' || existingMeta.wifi === 'Yes' || amenitiesLower.some(a => a.includes('wifi'))) ? 'Yes' : 'No';
  const refreshments = (data.refreshments === 'Yes' || customItem.refreshments === 'Yes' || existingMeta.refreshments === 'Yes' || amenitiesLower.some(a => a.includes('refreshment'))) ? 'Yes' : 'No';
  const carSeat = (data.carSeat === 'Yes' || data.car_seat === 'Yes' || customItem.carSeat === 'Yes' || customItem.car_seat === 'Yes' || existingMeta.carSeat === 'Yes' || existingMeta.car_seat === 'Yes' || amenitiesLower.some(a => a.includes('car seat') || a.includes('baby'))) ? 'Yes' : 'No';
  const stops = data.stops || customItem.stops || existingMeta.stops || 'No';
  const stopLocations = data.stopLocations || data.stop_locations || customItem.stopLocations || existingMeta.stopLocations || null;
  const rawBags = Number(data.bags !== undefined ? data.bags : (customItem.bags !== undefined ? customItem.bags : (existingMeta.bags !== undefined ? existingMeta.bags : 0)));
  const luggage = (data.luggage && data.luggage !== 'No') ? data.luggage : (customItem.luggage && customItem.luggage !== 'No' ? customItem.luggage : (existingMeta.luggage && existingMeta.luggage !== 'No' ? existingMeta.luggage : (rawBags > 0 ? `Yes — ${rawBags} bag(s)` : 'No')));
  const bags = rawBags;
  const serviceType = data.serviceType || customItem.serviceType || existingMeta.serviceType || 'One Way';
  const returnDate = data.returnDate || customItem.returnDate || existingMeta.returnDate || null;
  const returnTime = data.returnTime || customItem.returnTime || existingMeta.returnTime || null;
  const pickupTime = data.pickupTime || customItem.pickupTime || existingMeta.pickupTime || null;
  const pickupLocation = data.pickupLocation || data.pickup_location || customItem.pickupLocation || existingMeta.pickupLocation || '';
  const dropLocation = data.dropLocation || data.drop_location || data.location || customItem.dropLocation || existingMeta.dropLocation || '';
  const totalDistance = data.totalDistance || data.total_distance || customItem.totalDistance || existingMeta.totalDistance || '';

  orderData.metadata = {
    ...existingMeta,
    numberOfPassengers,
    passengers: numberOfPassengers,
    passengerCount: numberOfPassengers,
    passengerName,
    guestName: passengerName,
    luggage: (luggage === 'Yes' && bags > 0) ? `Yes — ${bags} bag(s)` : luggage,
    bags,
    stops,
    stopLocations,
    wifi,
    refreshments,
    carSeat,
    amenities: amenitiesArray,
    serviceType,
    returnDate,
    returnTime,
    pickupTime,
    pickupLocation,
    dropLocation,
    location: dropLocation,
    totalDistance,
    customItems: metaCustomItems.length > 0 ? metaCustomItems : itemsToSave
  };

  const employee = await prisma.employee.findUnique({ where: { userId: performerId } });
  orderData.createdById = employee ? employee.id : 1;
  orderData.status = data.status || (isMarketplaceOrder ? 'operation' : 'draft');

  const newOrder = await orderRepo.createOrder(orderData, validOrderItems, orderTenantId);

  await logAudit({
    module: 'ORDERS',
    action: 'CREATE',
    description: `Created Order ${newOrder.orderNumber} for Client ${client.companyName}`,
    newValue: newOrder,
    performedBy: performerId
  });

  try {
    await prisma.notification.create({
      data: {
        title: 'New Order Created',
        message: `Order #${newOrder.id} (${newOrder.orderNumber}) placed by ${client.companyName}`,
        type: 'ORDER_CREATED',
        userId: performerId
      }
    });
  } catch (notifErr) {
    // Non-blocking notification dispatch
  }

  return newOrder;
};

export const getOrders = async (tenantId, query) => {
  return await orderRepo.findAllOrders(tenantId, query);
};

export const getOrderById = async (id, tenantId) => {
  const order = await orderRepo.findOrderById(id);
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  return order;
};

export const updateOrderStatus = async (id, status, tenantId, performerId, remarks) => {
  const order = await getOrderById(id, tenantId);

  if (order.status === 'cancelled') {
    throw new AppError('Cannot update a cancelled order', 400);
  }

  // --- Build workflow history entry ---
  const currentMeta = typeof order.metadata === 'string'
    ? JSON.parse(order.metadata)
    : (order.metadata || {});

  const existingHistory = Array.isArray(currentMeta.workflowHistory) ? currentMeta.workflowHistory : [];

  const historyEntry = {
    department: String(status).toLowerCase(),
    previousDepartment: String(order.status || '').toLowerCase(),
    movedBy: performerId,
    movedAt: new Date().toISOString(),
    ...(remarks ? { remarks } : {})
  };

  const newMetadata = {
    ...currentMeta,
    status: String(status).toLowerCase(),
    currentDepartment: String(status).toLowerCase(),
    workflowHistory: [...existingHistory, historyEntry]
  };

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

    // Update order status + persist new metadata with workflow history
    updatedOrder = await tx.order.update({
      where: { id },
      data: {
        status,
        metadata: newMetadata
      }
    });

    // If order is completed/delivered, sync associated deliveries
    if (['completed', 'delivered'].includes(String(status).toLowerCase())) {
      await tx.delivery.updateMany({
        where: { orderId: id },
        data: { status: 'delivered' }
      }).catch(() => null);
    }
  });

  await logAudit({
    module: 'ORDERS',
    action: 'STATUS_CHANGE',
    description: `Order ${order.orderNumber} forwarded from ${order.status} → ${status}`,
    oldValue: { status: order.status },
    newValue: { status, workflowEntry: historyEntry },
    performedBy: performerId
  });

  const { metadata, ...rest } = updatedOrder;
  const metadataObj = typeof metadata === 'string' ? JSON.parse(metadata) : (metadata || {});
  return {
    ...metadataObj,
    ...rest,
    status,
    metadata: metadataObj
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
    const c0 = customItems[0];
    if (c0.passengerName) metadataExt.passengerName = c0.passengerName;
    if (c0.guestName) metadataExt.guestName = c0.guestName;
    if (c0.numberOfPassengers) {
      metadataExt.numberOfPassengers = Number(c0.numberOfPassengers);
      metadataExt.passengers = Number(c0.numberOfPassengers);
      metadataExt.passengerCount = Number(c0.numberOfPassengers);
    }
    if (c0.wifi) metadataExt.wifi = c0.wifi;
    if (c0.refreshments) metadataExt.refreshments = c0.refreshments;
    if (c0.carSeat) metadataExt.carSeat = c0.carSeat;
    if (c0.stops) metadataExt.stops = c0.stops;
    if (c0.stopLocations) metadataExt.stopLocations = c0.stopLocations;
    if (c0.luggage) metadataExt.luggage = c0.luggage;
    if (c0.bags !== undefined) metadataExt.bags = c0.bags;
    if (c0.serviceType) metadataExt.serviceType = c0.serviceType;
    if (c0.returnDate) metadataExt.returnDate = c0.returnDate;
    if (c0.returnTime) metadataExt.returnTime = c0.returnTime;
    if (c0.pickupTime) metadataExt.pickupTime = c0.pickupTime;
    if (c0.pickupLocation) metadataExt.pickupLocation = c0.pickupLocation;
    if (c0.dropLocation || c0.location) {
      metadataExt.dropLocation = c0.dropLocation || c0.location;
      metadataExt.location = c0.dropLocation || c0.location;
    }
    if (c0.amenities) metadataExt.amenities = c0.amenities;
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
    client_name: clientName,
    orderRef: order.id,
    order_ref: order.id,
    order_id: order.id
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

  // Update original order's status to logistics
  try {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'logistics' }
    });
  } catch (_) {}

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

export const deleteOrder = async (orderId, tenantIdToFilter, clientIdToFilter, performerId) => {
  return await prisma.$transaction(async (tx) => {
    let where = { id: orderId };
    if (tenantIdToFilter !== null) where.tenantId = tenantIdToFilter;
    if (clientIdToFilter !== null) where.clientId = clientIdToFilter;

    let order = await tx.order.findFirst({
      where,
      include: { items: true }
    });

    if (!order && tenantIdToFilter !== null) {
      const fallbackWhere = { id: orderId };
      if (clientIdToFilter !== null) fallbackWhere.clientId = clientIdToFilter;
      order = await tx.order.findFirst({
        where: fallbackWhere,
        include: { items: true }
      });
    }

    if (!order) {
      throw new AppError('Order not found or access denied', 404);
    }

    // Release reserved stock for inventory items if status is not delivered/cancelled
    if (order.status !== 'delivered' && order.status !== 'cancelled' && order.orderType === 'DELIVERY') {
      await releaseReservedStock(tx, order.items);
    }

    // Cascade delete Invoices & related
    const invoices = await tx.invoice.findMany({ where: { orderId: order.id }, select: { id: true } });
    const invoiceIds = invoices.map(i => i.id);
    if (invoiceIds.length > 0) {
      await tx.receipt.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
      await tx.payment.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
      await tx.invoiceItem.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
      await tx.invoice.deleteMany({ where: { orderId: order.id } });
    }

    // Cascade delete Deliveries & related
    const deliveries = await tx.delivery.findMany({ where: { orderId: order.id }, select: { id: true } });
    const deliveryIds = deliveries.map(d => d.id);
    if (deliveryIds.length > 0) {
      await tx.deliveryItem.deleteMany({ where: { deliveryId: { in: deliveryIds } } });
      await tx.delivery.deleteMany({ where: { orderId: order.id } });
    }

    // Cascade delete Missions
    await tx.mission.deleteMany({ where: { orderId: order.id } });

    // Delete associated order items
    if (order.items && order.items.length > 0) {
      await tx.orderItem.deleteMany({ where: { orderId: order.id } });
    }

    // Delete the order itself
    await tx.order.delete({ where: { id: order.id } });

    await logAudit({
      module: 'ORDERS',
      action: 'DELETE',
      description: `Deleted Order ${order.orderNumber}`,
      newValue: null,
      performedBy: performerId
    });

    return true;
  }, { maxWait: 15000, timeout: 30000 });
};


