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
      order = await prisma.order.findFirst({
        where: {
          orderNumber: String(data.orderId),
          ...(tenantId !== null && { tenantId })
        },
        include: { items: true }
      });
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
            // Email didn't match — fall back to any client for this tenant
            clientIdToUse = null;
          }
        } else {
          clientIdToUse = null;
        }
      }
    }

    if (!clientIdToUse) {
      const defaultClient = await prisma.client.findFirst({ where: { ...(tenantId != null && { tenantId }) } });
      if (!defaultClient) throw new AppError('No clients available to assign to ad-hoc mission', 400);
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

    // Find or create category for this tenant (needed for creating custom items)
    let category = await prisma.itemCategory.findFirst({
      where: { name: 'General', ...(tenantId != null && { tenantId }) }
    });
    if (!category) {
      category = await prisma.itemCategory.create({
        data: {
          name: 'General',
          description: 'General Category',
          tenantId: tenantId || 1,
          status: 'active'
        }
      });
    }

    // Find or create unit for this tenant
    let unit = await prisma.itemUnit.findFirst({
      where: { shortName: 'pcs', ...(tenantId != null && { tenantId }) }
    });
    if (!unit) {
      unit = await prisma.itemUnit.create({
        data: {
          name: 'Pieces',
          shortName: 'pcs',
          tenantId: tenantId || 1,
          status: 'active'
        }
      });
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

    const validItems = await Promise.all(items.map(async (it, index) => {
      // 1. Try to find the item by its ID for this tenant
      const itemExists = it.itemId ? await prisma.item.findFirst({ where: { id: Number(it.itemId), ...(tenantId != null && { tenantId }) } }) : null;

      let finalItemId;
      if (itemExists) {
        finalItemId = itemExists.id;
      } else {
        // 2. Get the actual item name from the manifest
        const manifestItem = manifestItems[index];
        const itemName = (manifestItem?.name || '').trim() || `Custom Item ${index + 1}`;

        // 3. Try to find an existing item by name for this tenant
        let itemByName = await prisma.item.findFirst({
          where: { name: itemName, ...(tenantId != null && { tenantId }) }
        });

        // 4. Create the item if it doesn't exist
        if (!itemByName) {
          itemByName = await prisma.item.create({
            data: {
              tenantId: tenantId || 1,
              categoryId: category.id,
              unitId: unit.id,
              sku: 'ITEM-' + Date.now().toString().slice(-6) + '-' + index,
              name: itemName,
              description: manifestItem?.weight ? `${itemName} (Weight: ${manifestItem.weight})` : itemName,
              inventoryType: 'INTERNAL',
              price: 0,
              status: 'active'
            }
          });
        }

        finalItemId = itemByName.id;
      }

      it.itemId = finalItemId; // Mutate the original item so the validation loop sees the correct ID
      return {
        itemId: finalItemId,
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

  if (deliveryData.assigned_driver) {
    const emp = await prisma.employee.findFirst({ where: { userId: Number(deliveryData.assigned_driver) } });
    if (emp) deliveryData.assignedTo = emp.id;
    delete deliveryData.assigned_driver;
  }

  if (!['draft', 'pending', 'approved', 'ready_for_delivery', 'planned', 'active', 'in_progress', 'Pending', 'In Progress', 'operation', 'procurement', 'inventory', 'logistics', 'concierge', 'created', 'admin_review', 'pending_review'].includes(order.status)) {
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

  // Validate quantities: Delivery quantity cannot exceed (Order Quantity - Already Delivered Quantity)
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
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

    if (!orderItem) {
      // Bespoke/custom item without a corresponding order item in the DB.
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
      throw new AppError(`Cannot deliver ${item.quantity} for item ${item.itemId}. Only ${remainingToDeliver} remaining.`, 400);
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
  if (parsedData.etaSchedule) parsedData.etaSchedule = new Date(parsedData.etaSchedule);
  if (parsedData.requestDate) parsedData.requestDate = new Date(parsedData.requestDate);
  if (parsedData.dueDate) parsedData.dueDate = new Date(parsedData.dueDate);

  const signature = parsedData.signature;
  delete parsedData.signature;

  delete parsedData.items;
  delete parsedData.deliveryNumber;
  delete parsedData.tenantId;

  if (parsedData.assigned_driver) {
    const emp = await prisma.employee.findFirst({ where: { userId: Number(parsedData.assigned_driver) } });
    if (emp) parsedData.assignedTo = emp.id;
    delete parsedData.assigned_driver;
  }

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
