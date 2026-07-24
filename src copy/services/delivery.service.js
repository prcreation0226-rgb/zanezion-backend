import * as deliveryRepo from '../repositories/delivery.repository.js';
import * as orderRepo from '../repositories/order.repository.js';
import * as warehouseRepo from '../repositories/warehouse.repository.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';
import prisma from '../config/db.js';

export const createDelivery = async (data, performerId, tenantId) => {
  const { items, ...deliveryData } = data;

  let order;
  if (data.orderId) {
    order = await orderRepo.findOrderById(Number(data.orderId));
    if (!order) {
      const strId = String(data.orderId);
      if (strId.length >= 8) {
        const formattedRef = `ORD-${strId.slice(0, 4)}-${strId.slice(4)}`;
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
    let clientIdToUse = data.clientId;
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
    if (!adHocWarehouseId) throw new AppError('No warehouse available for ad-hoc mission', 400);

    let defaultItem = await prisma.item.findFirst({ where: { ...(tenantId != null && { tenantId }) } });
    if (!defaultItem) {
      defaultItem = await prisma.item.create({
        data: {
          tenantId: tenantId || 1,
          itemCode: 'MISC-001',
          name: 'Miscellaneous Asset',
          category: 'General',
          type: 'product',
          unit: 'pcs',
          unitPrice: 0,
          inventoryStatus: 'in_stock'
        }
      });
    }

    data.warehouseId = adHocWarehouseId;
    deliveryData.warehouseId = adHocWarehouseId;

    const employee = await prisma.employee.findUnique({ where: { userId: performerId } });
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

    const validItems = await Promise.all(items.map(async (it) => {
      const itemExists = it.itemId ? await prisma.item.findUnique({ where: { id: Number(it.itemId) } }) : null;
      const finalItemId = itemExists ? itemExists.id : defaultItem.id;
      it.itemId = finalItemId; // Mutate the original item so the validation loop sees the correct ID
      return {
        itemId: finalItemId,
        quantity: it.quantity || 1,
        unitPrice: 0,
        warehouseId: adHocWarehouseId
      };
    }));

    order = await orderRepo.createOrder({
      orderNumber: orderNumberToUse,
      clientId: clientIdToUse,
      createdById: orderCreatedById,
      status: 'approved',
      orderType: data.missionType === 'Chauffeur' ? 'Service' : 'Delivery',
      priority: 'high'
    }, validItems, tenantId);

    data.orderId = order.id;
    deliveryData.orderId = order.id;
    deliveryData.clientId = clientIdToUse;
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
    // Find the first available warehouse for this tenant
    const firstWarehouse = await prisma.warehouse.findFirst({
      where: {
        ...(tenantId != null && { tenantId })
      }
    });
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
  if (!warehouse || (tenantId !== null && warehouse.tenantId !== tenantId)) {
    throw new AppError('Warehouse not found', 404);
  }

  deliveryData.clientId = order.clientId;

  const validDeliveryItems = [];

  // Validate quantities: Delivery quantity cannot exceed (Order Quantity - Already Delivered Quantity)
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const orderItemId = item.orderItemId;
    let orderItem;

    if (orderItemId) {
      orderItem = order.items?.find(oi => oi.id == orderItemId);
    } else {
      orderItem = order.items?.find(oi => oi.itemId == item.itemId);
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

    // Set the resolved orderItemId on the item
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
  const delivery = await deliveryRepo.findDeliveryById(id);
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

  if (['cancelled', 'delivered'].includes(delivery.status)) {
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
  delete parsedData.items;
  delete parsedData.deliveryNumber;
  delete parsedData.tenantId;

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
    updatedDelivery = await deliveryRepo.updateDelivery(id, data);
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
