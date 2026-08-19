import * as deliveryRepo from '../repositories/delivery.repository.js';
import * as orderRepo from '../repositories/order.repository.js';
import * as warehouseRepo from '../repositories/warehouse.repository.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';
import prisma from '../config/db.js';

export const createDelivery = async (data, performerId, tenantId) => {
  const { items, ...deliveryData } = data;

  // Only keep fields that exist in the Delivery Prisma model to prevent
  // unknown fields (client, companyId, customerId, etc.) from crashing Prisma
  const validDeliveryFields = [
    'orderId', 'clientId', 'assignedTo', 'warehouseId', 'status',
    'dispatchDate', 'deliveryDate', 'remarks', 'missionType',
    'transportMode', 'vehicleRef', 'etaSchedule', 'requestDate',
    'dueDate', 'pickupLocation', 'dropLocation', 'routeDistance',
    'staffPayRate', 'deliveryFee'
  ];
  Object.keys(deliveryData).forEach(key => {
    if (!validDeliveryFields.includes(key)) delete deliveryData[key];
  });

  let order;
  if (data.orderId) {
    const numericOrderId = Number(data.orderId);
    if (!isNaN(numericOrderId)) {
      order = await orderRepo.findOrderById(numericOrderId);
    }
    
    if (!order) {
      const strId = String(data.orderId);
      if (strId.length >= 8) {
        // Just search directly if it looks like an order number format
        let formattedRef = strId;
        if (!strId.startsWith('ORD-') && strId.length === 8) {
             formattedRef = `ORD-${strId.slice(0, 4)}-${strId.slice(4)}`;
        }
        order = await prisma.order.findFirst({
          where: {
            orderNumber: formattedRef,
            ...(tenantId !== null && { tenantId })
          },
          include: { items: true }
        });
      }
    }
    if (!order) {
      const cleanDigits = String(data.orderId).replace(/\D/g, '');
      const parsedNum = cleanDigits ? Number(cleanDigits) : null;
      if (parsedNum) {
        order = await orderRepo.findOrderById(parsedNum);
      }
    }
    if (order) {
      data.orderId = order.id;
      deliveryData.orderId = order.id;
    }
  }

  if (!order || (tenantId !== null && order.tenantId !== tenantId)) {
    // Auto-create an ad-hoc order to support "Deploy New Mission" standalone flow
    let clientIdToUse = data.clientId ? Number(data.clientId) : null;

    // Validate that clientIdToUse actually exists in the clients table
    if (clientIdToUse) {
      const clientExists = await prisma.client.findFirst({
        where: { id: clientIdToUse, ...(tenantId != null && { tenantId }) }
      });
      if (!clientExists) {
        // The provided ID might be a User ID instead of a Client ID.
        // Try to find the client by looking up the user's email.
        const userForClient = await prisma.user.findUnique({ where: { id: clientIdToUse } });
        if (userForClient?.email) {
          const clientByEmail = await prisma.client.findFirst({
            where: { email: userForClient.email, ...(tenantId != null && { tenantId }) }
          });
          if (clientByEmail) {
            clientIdToUse = clientByEmail.id;
          } else {
            clientIdToUse = null;
          }
        } else {
          clientIdToUse = null;
        }
      }
    }

    if (!clientIdToUse) {
      let defaultClient = await prisma.client.findFirst({ where: { ...(tenantId != null && { tenantId }) } });
      if (!defaultClient) {
        defaultClient = await prisma.client.findFirst({});
      }
      if (!defaultClient) {
        defaultClient = await prisma.client.create({
          data: {
            companyName: 'General Client',
            contactPerson: 'Default Client',
            email: 'client@zanezion.com',
            tenantId: tenantId || 1
          }
        });
      }
      clientIdToUse = defaultClient.id;
    }

    let adHocWarehouseId = data.warehouseId;
    if (!adHocWarehouseId) {
      const firstWarehouse = await prisma.warehouse.findFirst({ where: { ...(tenantId != null && { tenantId }) } });
      if (firstWarehouse) adHocWarehouseId = firstWarehouse.id;
    }
    if (!adHocWarehouseId) {
      const newWarehouse = await prisma.warehouse.create({
        data: {
          name: 'Main Warehouse',
          location: 'Default Location',
          tenantId: tenantId || 1
        }
      });
      adHocWarehouseId = newWarehouse.id;
    }

    // Parse manifest items from remarks to get actual item names
    let manifestItems = [];
    try {
      const remarksData = typeof data.remarks === 'string' ? JSON.parse(data.remarks) : (data.remarks || {});
      manifestItems = Array.isArray(remarksData.manifestItems) ? remarksData.manifestItems : [];
    } catch (e) { /* ignore parse errors */ }

    data.warehouseId = adHocWarehouseId;
    deliveryData.warehouseId = adHocWarehouseId;

    const employee = await prisma.employee.findFirst({ where: { userId: performerId } });
    const orderCreatedById = employee ? employee.id : 1;

    let orderNumberToUse = undefined;
    if (data.orderId) {
      const strId = String(data.orderId);
      if (strId.startsWith('ORD-')) {
        orderNumberToUse = strId;
      } else if (strId.length >= 8) {
        orderNumberToUse = `ORD-${strId.slice(0, 4)}-${strId.slice(4)}`;
      }
    }

    const itemsToProcess = items || [];
    
    // Build valid order items without creating garbage records in the Item inventory table
    const validItems = await Promise.all(itemsToProcess.map(async (it, index) => {
      let itemExists = null;
      const numItemId = Number(it.itemId);
      if (it.itemId && !isNaN(numItemId) && numItemId > 0) {
        itemExists = await prisma.item.findFirst({
          where: { id: numItemId, ...(tenantId != null && { tenantId }) }
        });
      }

      const manifestItem = manifestItems[index];
      const itemName = (manifestItem?.name || it.name || '').trim() || `Custom Item ${index + 1}`;

      return {
        ...(itemExists ? { itemId: itemExists.id } : {}),
        name: itemName,
        quantity: it.quantity || 1,
        unitPrice: 0,
        warehouseId: adHocWarehouseId
      };
    }));

    // Build order metadata from manifest so order page shows correct info
    const orderMetadata = {};
    if (manifestItems.length > 0) {
      orderMetadata.manifestItems = manifestItems;
    }
    if (data.missionType) orderMetadata.missionType = data.missionType;
    if (data.transportMode) orderMetadata.transportMode = data.transportMode;
    if (data.pickupLocation) orderMetadata.pickupLocation = data.pickupLocation;
    if (data.dropLocation) orderMetadata.dropLocation = data.dropLocation;

    order = await orderRepo.createOrder({
      orderNumber: orderNumberToUse,
      clientId: clientIdToUse,
      createdById: orderCreatedById,
      status: 'approved',
      orderType: data.missionType === 'Chauffeur' ? 'Service' : 'Delivery',
      priority: 'high',
      metadata: orderMetadata
    }, validItems, tenantId);

    data.orderId = order.id;
    deliveryData.orderId = order.id;
    deliveryData.clientId = clientIdToUse;
  }

  if (deliveryData.assignedTo !== undefined || deliveryData.assigned_driver !== undefined || deliveryData.driverId !== undefined) {
    const rawAssigned = deliveryData.assignedTo ?? deliveryData.assigned_driver ?? deliveryData.driverId;
    const targetUserId = Number(rawAssigned);
    if (rawAssigned === null || rawAssigned === '') {
      delete deliveryData.assignedTo;
    } else if (!isNaN(targetUserId) && targetUserId > 0) {
      let emp = await prisma.employee.findFirst({ where: { userId: targetUserId } });
      if (!emp) {
        emp = await prisma.employee.findUnique({ where: { id: targetUserId } });
      }
      if (!emp) {
        emp = await prisma.employee.findFirst({ where: { ...(tenantId != null && { tenantId }) } });
      }
      if (emp) {
        deliveryData.assignedTo = emp.id;
      } else {
        delete deliveryData.assignedTo;
      }
    } else {
      delete deliveryData.assignedTo;
    }
    delete deliveryData.assigned_driver;
    delete deliveryData.driverId;
  }

  const blockedStatuses = ['completed', 'Completed', 'cancelled', 'Cancelled', 'rejected', 'Rejected'];
  if (blockedStatuses.includes(order.status)) {
    throw new AppError(`Cannot create delivery for order in ${order.status} status`, 400);
  }

  // Resolve warehouseId if it's missing or null
  let warehouseId = data.warehouseId;
  if (!warehouseId && order.items && order.items.length > 0) {
    // Default to the warehouse of the first item in the order
    warehouseId = order.items[0].warehouseId;
  }

  if (!warehouseId) {
    let firstWarehouse = await prisma.warehouse.findFirst({
      where: {
        ...(tenantId != null && { tenantId })
      }
    });
    if (!firstWarehouse && tenantId !== 1) {
      firstWarehouse = await prisma.warehouse.findFirst({ where: { tenantId: 1 } });
    }
    if (firstWarehouse) {
      warehouseId = firstWarehouse.id;
    }
  }

  if (!warehouseId) {
    throw new AppError('Warehouse ID is required and no default warehouse could be found', 400);
  }

  // Update variables so downstream logic uses the resolved warehouseId
  data.warehouseId = warehouseId;
  deliveryData.warehouseId = warehouseId;

  const warehouse = await warehouseRepo.findWarehouseById(warehouseId);
  if (!warehouse || (tenantId !== null && warehouse.tenantId !== tenantId && warehouse.tenantId !== 1)) {
    throw new AppError('Warehouse not found', 404);
  }

  deliveryData.clientId = order.clientId;

  const validDeliveryItems = [];
  const itemsArray = Array.isArray(items) ? items : [];

  // Validate quantities: Delivery quantity cannot exceed (Order Quantity - Already Delivered Quantity)
  for (let i = 0; i < itemsArray.length; i++) {
    const item = itemsArray[i];
    let orderItem;

    if (item.orderItemId) {
      const numericOrderItemId = Number(item.orderItemId);
      if (!isNaN(numericOrderItemId) && numericOrderItemId > 0) {
          orderItem = order.items?.find(oi => oi.id == numericOrderItemId);
      }
    } 
    
    if (!orderItem) {
      let numericItemId = Number(item.itemId);
      if (!isNaN(numericItemId) && numericItemId > 0) {
          orderItem = order.items?.find(oi => oi.itemId == numericItemId);
      }
      
      if (!orderItem && order.items && order.items[i]) {
        orderItem = order.items[i];
        item.itemId = orderItem.itemId;
      }
    }

    if (!orderItem || !orderItem.itemId) {
      // Bespoke/custom item or service without a corresponding inventory item in the DB.
      // We skip adding it to validDeliveryItems to avoid foreign key constraints.
      // The manifest data is already safely stored in the JSON remarks string.
      continue;
    }

    if (!item.orderItemId) {
      item.orderItemId = orderItem.id;
    }
    
    if (orderItem.warehouseId && orderItem.warehouseId !== data.warehouseId) {
      // Optional: Log mismatch but don't strictly block unless required
    }

    const alreadyDelivered = await deliveryRepo.getDeliveredQuantityForOrderItem(item.orderItemId);
    const remainingToDeliver = orderItem.quantity - alreadyDelivered;

    if (item.quantity > remainingToDeliver) {
      if (remainingToDeliver > 0) {
        item.quantity = remainingToDeliver;
      } else {
        continue;
      }
    }
    
    validDeliveryItems.push(item);
  }

  const newDelivery = await deliveryRepo.createDelivery(deliveryData, validDeliveryItems, tenantId);

  // If order was approved, draft or pending, mark it as ready_for_delivery automatically
  if (['draft', 'pending', 'Pending', 'approved'].includes(order.status)) {
    await orderRepo.updateOrderStatus(order.id, 'ready_for_delivery');
  }

  await logAudit({
    module: 'DELIVERIES',
    action: 'CREATE',
    description: `Created Delivery ${newDelivery.deliveryNumber} for Order ${order.orderNumber}`,
    newValue: newDelivery,
    performedBy: performerId
  });

  return newDelivery;
};

export const getDeliveries = async (tenantId, query) => {
  return await deliveryRepo.findAllDeliveries(tenantId, query);
};

export const getDeliveryById = async (id, tenantId, clientId = null) => {
  let delivery = await deliveryRepo.findDeliveryById(id);
  if (!delivery && !isNaN(id)) {
    delivery = await prisma.delivery.findFirst({
      where: { orderId: Number(id) },
      include: {
        items: { include: { item: true, orderItem: true } },
        client: true,
        order: true,
        assignee: { select: { firstName: true, lastName: true } },
        warehouse: { select: { name: true } },
        missions: true,
        proofs: true
      }
    });
  }
  
  console.log('[DEBUG GET] ID:', id, 'tenantId:', tenantId, 'clientId:', clientId);
  if (delivery) {
    console.log('[DEBUG GET] delivery found! tenantId:', delivery.tenantId, 'clientId:', delivery.clientId);
  } else {
    console.log('[DEBUG GET] delivery NOT found in DB');
  }

  if (!delivery || (tenantId !== null && delivery.tenantId !== tenantId) || (clientId !== null && delivery.clientId !== clientId)) {
    throw new AppError('Delivery not found', 404);
  }
  return delivery;
};

export const cancelDelivery = async (id, tenantId, performerId, clientId = null) => {
  const delivery = await getDeliveryById(id, tenantId, clientId);

  if (['dispatched', 'in_transit', 'delivered'].includes(delivery.status)) {
    throw new AppError(`Cannot cancel delivery in ${delivery.status} status`, 400);
  }

  await prisma.$transaction(async (tx) => {
    await deliveryRepo.updateDeliveryStatus(tx, id, 'cancelled');
    
    // Auto cancel associated missions if any
    await tx.mission.updateMany({
      where: { deliveryId: id, status: { notIn: ['completed', 'cancelled'] } },
      data: { status: 'cancelled' }
    });
  });

  await logAudit({
    module: 'DELIVERIES',
    action: 'CANCEL',
    description: `Cancelled Delivery ${delivery.deliveryNumber}`,
    oldValue: delivery,
    performedBy: performerId
  });

  return true;
};

export const updateDelivery = async (id, data, tenantId, performerId, clientId = null) => {
  const delivery = await getDeliveryById(id, tenantId, clientId);

  if (['cancelled'].includes(delivery.status) || (delivery.status === 'delivered' && !data.signature)) {
    throw new AppError(`Cannot update delivery in ${delivery.status} status`, 400);
  }

  // Determine if we need to dispatch and decrement stock
  const isTransitioningToDispatch = ['en_route', 'dispatched', 'in_transit'].includes(data.status) && 
    !['en_route', 'dispatched', 'in_transit', 'delivered'].includes(delivery.status);

  let updatedDelivery;

  // Build the update payload (same logic as deliveryRepo.updateDelivery)
  const parsedData = { ...data };
  if (parsedData.etaSchedule && !isNaN(new Date(parsedData.etaSchedule).getTime())) {
    parsedData.etaSchedule = new Date(parsedData.etaSchedule);
  } else {
    delete parsedData.etaSchedule;
  }
  if (parsedData.requestDate && !isNaN(new Date(parsedData.requestDate).getTime())) {
    parsedData.requestDate = new Date(parsedData.requestDate);
  } else {
    delete parsedData.requestDate;
  }
  if (parsedData.dueDate && !isNaN(new Date(parsedData.dueDate).getTime())) {
    parsedData.dueDate = new Date(parsedData.dueDate);
  } else {
    delete parsedData.dueDate;
  }

  const signature = parsedData.signature;
  delete parsedData.signature;
  delete parsedData.items;
  delete parsedData.deliveryNumber;
  delete parsedData.tenantId;

  if (parsedData.assigned_driver !== undefined || parsedData.driverId !== undefined || parsedData.assignedTo !== undefined) {
    const targetUserId = Number(parsedData.assigned_driver || parsedData.driverId || parsedData.assignedTo);
    if (parsedData.assignedTo === null || parsedData.assigned_driver === null || parsedData.driverId === null) {
      parsedData.assignedTo = null;
    } else if (!isNaN(targetUserId) && targetUserId > 0) {
      let emp = await prisma.employee.findFirst({ where: { userId: targetUserId } });
      if (!emp) {
        emp = await prisma.employee.findUnique({ where: { id: targetUserId } });
      }
      if (!emp) {
        emp = await prisma.employee.findFirst({ where: { tenantId } });
      }
      if (emp) {
        parsedData.assignedTo = emp.id;
      }
    }
    delete parsedData.assigned_driver;
    delete parsedData.driverId;
  }

  if (parsedData.route_distance !== undefined) {
    const val = parseFloat(parsedData.route_distance);
    parsedData.routeDistance = !isNaN(val) ? val : null;
    delete parsedData.route_distance;
  }
  if (parsedData.staff_pay_rate !== undefined) {
    const val = parseFloat(parsedData.staff_pay_rate);
    parsedData.staffPayRate = !isNaN(val) ? val : null;
    delete parsedData.staff_pay_rate;
  }
  if (parsedData.delivery_fee !== undefined) {
    const val = parseFloat(parsedData.delivery_fee);
    parsedData.deliveryFee = !isNaN(val) ? val : null;
    delete parsedData.delivery_fee;
  }
  if (parsedData.vehicleRef !== undefined || parsedData.plate_number !== undefined || parsedData.vehicle_id !== undefined) {
    parsedData.vehicleRef = String(parsedData.vehicleRef || parsedData.plate_number || parsedData.vehicle_id || '');
    delete parsedData.plate_number;
    delete parsedData.vehicle_id;
  }
  if (parsedData.mode !== undefined || parsedData.transportMode !== undefined) {
    parsedData.transportMode = String(parsedData.mode || parsedData.transportMode || 'Road');
    delete parsedData.mode;
  }

  // Remove any remaining unknown keys not in schema
  const allowedKeys = [
    'orderId', 'clientId', 'assignedTo', 'warehouseId', 'status',
    'dispatchDate', 'deliveryDate', 'remarks', 'missionType',
    'transportMode', 'vehicleRef', 'etaSchedule', 'requestDate',
    'dueDate', 'pickupLocation', 'dropLocation', 'routeDistance',
    'staffPayRate', 'deliveryFee'
  ];

  Object.keys(parsedData).forEach(key => {
    if (!allowedKeys.includes(key)) {
      delete parsedData[key];
    }
  });

  if (signature) {
    const existingPOD = await prisma.proofOfDelivery.findFirst({
      where: { deliveryId: delivery.id }
    });
    if (existingPOD) {
      await prisma.proofOfDelivery.update({
        where: { id: existingPOD.id },
        data: { receiverSignature: signature, receiverName: signature }
      });
    } else {
      await prisma.proofOfDelivery.create({
        data: {
          deliveryId: delivery.id,
          tenantId: delivery.tenantId,
          receiverName: signature,
          receiverSignature: signature
        }
      });
    }
  }

  if (isTransitioningToDispatch) {
    // Run delivery update + stock decrement atomically in one transaction
    await prisma.$transaction(async (tx) => {
      updatedDelivery = await tx.delivery.update({
        where: { id },
        data: parsedData,
        include: { items: true, client: true, order: true }
      });

      for (const item of delivery.items) {
        const stock = await tx.inventoryStock.findUnique({
          where: { warehouseId_itemId: { warehouseId: delivery.warehouseId, itemId: item.itemId } }
        });

        if (stock) {
          await tx.inventoryStock.update({
            where: { id: stock.id },
            data: { quantity: { decrement: item.quantity } }
          });

          await tx.stockMovement.create({
            data: {
              tenantId: delivery.tenantId,
              warehouseId: delivery.warehouseId,
              itemId: item.itemId,
              movementType: 'OUT',
              quantity: item.quantity,
              referenceType: 'DELIVERY',
              referenceId: String(delivery.id),
              remarks: `Dispatched via Delivery status update to ${data.status}`
            }
          });
        }
      }
    });
  } else {
    // No stock changes needed — plain update
    updatedDelivery = await deliveryRepo.updateDelivery(id, parsedData);
  }

  if (delivery.orderId) {
    let orderTargetStatus = null;
    const normDelStatus = String(data.status || parsedData.status || '').toLowerCase().replace(/\s+/g, '_');
    if (['delivered', 'completed'].includes(normDelStatus)) {
      orderTargetStatus = 'completed';
    } else if (['in_transit', 'en_route', 'dispatched', 'on_way'].includes(normDelStatus)) {
      orderTargetStatus = 'in_transit';
    } else if (['assigned', 'accepted'].includes(normDelStatus) || (parsedData.assignedTo && parsedData.assignedTo > 0)) {
      orderTargetStatus = 'assigned';
    }
    if (orderTargetStatus) {
      try {
        await prisma.order.update({
          where: { id: delivery.orderId },
          data: { status: orderTargetStatus }
        });
      } catch (_) {}
    }
  }

  await logAudit({
    module: 'DELIVERIES',
    action: 'UPDATE',
    description: `Updated Delivery ${delivery.deliveryNumber}`,
    oldValue: delivery,
    newValue: updatedDelivery,
    performedBy: performerId
  });

  return updatedDelivery;
};

export const deleteDelivery = async (id, tenantId, performerId, clientId = null) => {
  const delivery = await getDeliveryById(id, tenantId, clientId);

  await prisma.$transaction(async (tx) => {
    // 1. Unlink Invoices
    await tx.invoice.updateMany({
      where: { deliveryId: id },
      data: { deliveryId: null }
    });

    // 2. Delete associated proofs
    await tx.proofOfDelivery.deleteMany({
      where: { deliveryId: id }
    });

    // 3. Delete associated missions
    await tx.mission.deleteMany({
      where: { deliveryId: id }
    });

    // 4. Delete associated items
    await tx.deliveryItem.deleteMany({
      where: { deliveryId: id }
    });

    // 5. Finally delete the delivery itself
    await tx.delivery.delete({
      where: { id }
    });
  });

  await logAudit({
    module: 'DELIVERIES',
    action: 'DELETE',
    description: `Deleted Delivery ${delivery.deliveryNumber}`,
    oldValue: delivery,
    performedBy: performerId
  });

  return true;
};
