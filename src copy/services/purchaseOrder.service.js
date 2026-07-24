import * as poRepository from '../repositories/purchaseOrder.repository.js';
import * as prRepository from '../repositories/purchaseRequest.repository.js';
import * as quotationRepository from '../repositories/quotation.repository.js';
import * as vendorRepository from '../repositories/vendor.repository.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';
import prisma from '../config/db.js';

export const createPurchaseOrder = async (data, performerId, tenantId) => {
  const pr = await prRepository.findPurchaseRequestById(data.purchaseRequestId);
  if (!pr || (tenantId !== null && pr.tenantId !== tenantId)) {
    throw new AppError('Purchase Request not found', 404);
  }

  // Allow PO creation if PR is approved or already in rfq_created status
  if (!['approved', 'rfq_created'].includes(String(pr.status).toLowerCase())) {
    throw new AppError(`Cannot create PO for PR in ${pr.status} status. PR must be approved.`, 400);
  }

  const vendor = await vendorRepository.findVendorById(data.vendorId);
  if (!vendor || (tenantId !== null && vendor.tenantId !== tenantId)) {
    throw new AppError('Vendor not found', 404);
  }

  if (data.quotationId) {
    const quotation = await quotationRepository.findQuotationById(data.quotationId);
    if (!quotation || (tenantId !== null && quotation.tenantId !== tenantId)) {
      throw new AppError('Quotation not found', 404);
    }
    if (quotation.status !== 'approved') {
      throw new AppError('Quotation must be approved to create a PO', 400);
    }
    if (quotation.rfq.purchaseRequestId !== data.purchaseRequestId) {
      throw new AppError('Quotation does not belong to this Purchase Request', 400);
    }
    if (quotation.vendorId !== data.vendorId) {
      throw new AppError('Quotation vendor does not match the requested Vendor', 400);
    }
  }

  const newPO = await poRepository.createPurchaseOrder({ ...data, tenantId });

  await logAudit({
    module: 'PURCHASE_ORDERS',
    action: 'CREATE',
    description: `Created PO ${newPO.poNumber} for Vendor ${vendor.companyName}`,
    newValue: newPO,
    performedBy: performerId
  });

  return newPO;
};

export const getPurchaseOrders = async (tenantId, query) => {
  const result = await poRepository.findAllPurchaseOrders(tenantId, query);
  result.purchaseOrders = result.purchaseOrders.map(po => {
    const items = po.purchaseRequest?.items || [];
    const mappedItems = items.map(item => ({
      id: item.id,
      name: item.itemName || item.name || '',
      orderedQty: item.quantity || item.qty || 0,
      price: item.estimatedCost || item.price || 0,
      category: item.category || 'General',
      receivedQty: item.receivedQty || 0,
      pending_receive_qty: item.pendingReceiveQty || 0,
      pendingQty: Math.max(0, (item.quantity || item.qty || 0) - (item.receivedQty || 0) - (item.pendingReceiveQty || 0))
    }));
    return {
      ...po,
      items: mappedItems
    };
  });
  return result;
};

export const getPurchaseOrderById = async (id, tenantId) => {
  const po = await poRepository.findPurchaseOrderById(id);
  if (!po || (tenantId !== null && po.tenantId !== tenantId)) {
    throw new AppError('Purchase Order not found', 404);
  }
  const items = po.purchaseRequest?.items || [];
  const mappedItems = items.map(item => ({
    id: item.id,
    name: item.itemName || item.name || '',
    orderedQty: item.quantity || item.qty || 0,
    price: item.estimatedCost || item.price || 0,
    category: item.category || 'General',
    receivedQty: item.receivedQty || 0,
    pending_receive_qty: item.pendingReceiveQty || 0,
    pendingQty: Math.max(0, (item.quantity || item.qty || 0) - (item.receivedQty || 0) - (item.pendingReceiveQty || 0))
  }));
  return {
    ...po,
    items: mappedItems
  };
};

export const updatePurchaseOrderStatus = async (id, status, tenantId, performerId) => {
  const po = await getPurchaseOrderById(id, tenantId);

  const updatedPO = await poRepository.updatePurchaseOrderStatus(id, status);

  await logAudit({
    module: 'PURCHASE_ORDERS',
    action: 'STATUS_CHANGE',
    description: `PO ${po.poNumber} status changed to ${status}`,
    oldValue: po,
    newValue: updatedPO,
    performedBy: performerId
  });

  return updatedPO;
};

export const updatePurchaseOrder = async (id, data, tenantId, performerId) => {
  const po = await getPurchaseOrderById(id, tenantId);
  const { items, ...poData } = data;

  const updatedPO = await prisma.$transaction(async (tx) => {
    // 1. Update PO fields
    const upPO = await tx.purchaseOrder.update({
      where: { id },
      data: poData,
      include: {
        vendor: true,
        purchaseRequest: { include: { items: true, department: true } },
        quotation: true
      }
    });

    // 2. If items are provided, update PurchaseRequestItems
    if (items && Array.isArray(items)) {
      const existingItems = await tx.purchaseRequestItem.findMany({
        where: { purchaseRequestId: po.purchaseRequestId }
      });
      const existingIds = existingItems.map(it => it.id);

      const incomingIds = items.filter(it => it.id && !String(it.id).startsWith('temp') && !isNaN(Number(it.id))).map(it => Number(it.id));
      const idsToDelete = existingIds.filter(id => !incomingIds.includes(id));

      if (idsToDelete.length > 0) {
        await tx.purchaseRequestItem.deleteMany({
          where: { id: { in: idsToDelete } }
        });
      }

      for (const item of items) {
        const itemData = {
          itemName: item.name,
          quantity: Number(item.orderedQty ?? item.quantity),
          estimatedCost: Number(item.price),
          unit: item.unit || 'pcs'
        };

        const isTempId = !item.id || String(item.id).startsWith('temp') || isNaN(Number(item.id));
        if (!isTempId && existingIds.includes(Number(item.id))) {
          await tx.purchaseRequestItem.update({
            where: { id: Number(item.id) },
            data: itemData
          });
        } else {
          await tx.purchaseRequestItem.create({
            data: {
              ...itemData,
              purchaseRequestId: po.purchaseRequestId
            }
          });
        }
      }
    }

    return await tx.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: true,
        purchaseRequest: { include: { items: true, department: true } },
        quotation: true
      }
    });
  });

  await logAudit({
    module: 'PURCHASE_ORDERS',
    action: 'UPDATE',
    description: `Updated PO ${po.poNumber}`,
    oldValue: po,
    newValue: updatedPO,
    performedBy: performerId
  });

  const updatedItems = updatedPO.purchaseRequest?.items || [];
  const mappedItems = updatedItems.map(item => ({
    id: item.id,
    name: item.itemName || item.name || '',
    orderedQty: item.quantity || item.qty || 0,
    price: item.estimatedCost || item.price || 0,
    category: item.category || 'General',
    receivedQty: item.receivedQty || 0,
    pendingQty: Math.max(0, (item.quantity || item.qty || 0) - (item.receivedQty || 0))
  }));

  return {
    ...updatedPO,
    items: mappedItems
  };
};

export const deletePurchaseOrder = async (id, tenantId, performerId) => {
  const po = await getPurchaseOrderById(id, tenantId);

  if (po.status !== 'draft' && po.status !== 'cancelled') {
    throw new AppError(`Cannot delete PO in ${po.status} status`, 400);
  }

  await poRepository.deletePurchaseOrder(id);

  await logAudit({
    module: 'PURCHASE_ORDERS',
    action: 'DELETE',
    description: `Deleted PO ${po.poNumber}`,
    oldValue: po,
    performedBy: performerId
  });

  return true;
};

export const receivePurchaseOrderGoods = async (id, body, tenantId, performerId) => {
  const { items, packingSlip, adminApproved } = body;

  if (!packingSlip) {
    throw new AppError('Packing slip / Delivery note is required to receive goods', 400);
  }

  const po = await getPurchaseOrderById(id, tenantId);
  if (!po) {
    throw new AppError('Purchase Order not found', 404);
  }

  const actualTenantId = po.tenantId || tenantId || 1;

  // Start a Prisma transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Process items from body
    for (const rItem of (items || [])) {
      const dbItem = await tx.purchaseRequestItem.findUnique({
        where: { id: Number(rItem.id) }
      });

      if (!dbItem) continue;

      if (adminApproved) {
        await tx.purchaseRequestItem.update({
          where: { id: dbItem.id },
          data: {
            receivedQty: { increment: Number(rItem.receivedQty || 0) }
          }
        });
      } else {
        await tx.purchaseRequestItem.update({
          where: { id: dbItem.id },
          data: {
            pendingReceiveQty: { increment: Number(rItem.receivedQty || 0) }
          }
        });
      }
    }

    // 2. Determine new status
    const allItems = await tx.purchaseRequestItem.findMany({
      where: { purchaseRequestId: po.purchaseRequestId }
    });

    let isFullyReceived = true;
    for (const item of allItems) {
      const totalRecv = item.receivedQty + item.pendingReceiveQty;
      if (totalRecv < item.quantity) {
        isFullyReceived = false;
      }
    }

    let status = po.status;
    if (adminApproved) {
      status = isFullyReceived ? 'Completed' : 'Partially Received';
    } else {
      status = 'Pending Receipt Approval';
    }

    const updateData = {
      status,
      adminApproved: !!adminApproved,
      ...(packingSlip && { packingSlip })
    };

    const updatedPO = await tx.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        vendor: true,
        purchaseRequest: { include: { items: true, department: true } },
        quotation: true
      }
    });

    // 3. Increment stock if adminApproved is true
    if (adminApproved) {
      let warehouse = await tx.warehouse.findFirst({
        where: { tenantId: actualTenantId, status: 'active' }
      });
      if (!warehouse) {
        warehouse = await tx.warehouse.create({
          data: {
            tenantId: actualTenantId,
            name: 'Main Warehouse',
            status: 'active'
          }
        });
      }

      for (const rItem of (items || [])) {
        if (Number(rItem.receivedQty) > 0) {
          const dbItem = allItems.find(it => it.id === Number(rItem.id));
          if (!dbItem) continue;

          let invItem = await tx.item.findFirst({
            where: { tenantId: actualTenantId, name: dbItem.itemName }
          });
          if (!invItem) {
            let category = await tx.itemCategory.findFirst({ where: { tenantId: actualTenantId } });
            if (!category) {
              category = await tx.itemCategory.create({
                data: { tenantId: actualTenantId, name: 'General', status: 'active' }
              });
            }
            let unit = await tx.itemUnit.findFirst({ where: { tenantId: actualTenantId } });
            if (!unit) {
              unit = await tx.itemUnit.create({
                data: { tenantId: actualTenantId, name: dbItem.unit || 'pcs', shortName: dbItem.unit || 'pcs', status: 'active' }
              });
            }
            const sku = `SKU-${dbItem.itemName.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;
            invItem = await tx.item.create({
              data: {
                tenantId: actualTenantId,
                categoryId: category.id,
                unitId: unit.id,
                sku,
                name: dbItem.itemName,
                price: Number(dbItem.estimatedCost || 0),
                status: 'active'
              }
            });
          }

          await tx.inventoryStock.upsert({
            where: { warehouseId_itemId: { warehouseId: warehouse.id, itemId: invItem.id } },
            create: {
              tenantId: actualTenantId,
              warehouseId: warehouse.id,
              itemId: invItem.id,
              quantity: Number(rItem.receivedQty)
            },
            update: {
              quantity: { increment: Number(rItem.receivedQty) }
            }
          });

          await tx.stockMovement.create({
            data: {
              tenantId: actualTenantId,
              warehouseId: warehouse.id,
              itemId: invItem.id,
              movementType: 'IN',
              quantity: Number(rItem.receivedQty),
              referenceType: 'GRN',
              remarks: `Stock received against PO ${po.poNumber}`
            }
          });
        }
      }
    }

    return updatedPO;
  });

  await logAudit({
    module: 'PURCHASE_ORDERS',
    action: 'RECEIVE_GOODS',
    description: `Registered goods reception against PO ${po.poNumber}`,
    newValue: result,
    performedBy: performerId
  });

  const itemsList = result.purchaseRequest?.items || [];
  const mappedItems = itemsList.map(item => ({
    id: item.id,
    name: item.itemName || item.name || '',
    orderedQty: item.quantity || item.qty || 0,
    price: item.estimatedCost || item.price || 0,
    category: item.category || 'General',
    receivedQty: item.receivedQty || 0,
    pending_receive_qty: item.pendingReceiveQty || 0,
    pendingQty: Math.max(0, (item.quantity || item.qty || 0) - (item.receivedQty || 0) - (item.pendingReceiveQty || 0))
  }));

  return {
    ...result,
    items: mappedItems
  };
};

export const approvePurchaseOrderReceipt = async (id, tenantId, performerId) => {
  const po = await getPurchaseOrderById(id, tenantId);
  if (!po) {
    throw new AppError('Purchase Order not found', 404);
  }

  const actualTenantId = po.tenantId || tenantId || 1;

  const result = await prisma.$transaction(async (tx) => {
    const allItems = await tx.purchaseRequestItem.findMany({
      where: { purchaseRequestId: po.purchaseRequestId }
    });

    let warehouse = await tx.warehouse.findFirst({
      where: { tenantId: actualTenantId, status: 'active' }
    });
    if (!warehouse) {
      warehouse = await tx.warehouse.create({
        data: {
          tenantId: actualTenantId,
          name: 'Main Warehouse',
          status: 'active'
        }
      });
    }

    for (const item of allItems) {
      const toApprove = item.pendingReceiveQty || 0;
      if (toApprove > 0) {
        await tx.purchaseRequestItem.update({
          where: { id: item.id },
          data: {
            receivedQty: { increment: toApprove },
            pendingReceiveQty: 0
          }
        });

        let invItem = await tx.item.findFirst({
          where: { tenantId: actualTenantId, name: item.itemName }
        });
        if (!invItem) {
          let category = await tx.itemCategory.findFirst({ where: { tenantId: actualTenantId } });
          if (!category) {
            category = await tx.itemCategory.create({
              data: { tenantId: actualTenantId, name: 'General', status: 'active' }
            });
          }
          let unit = await tx.itemUnit.findFirst({ where: { tenantId: actualTenantId } });
          if (!unit) {
            unit = await tx.itemUnit.create({
              data: { tenantId: actualTenantId, name: item.unit || 'pcs', shortName: item.unit || 'pcs', status: 'active' }
            });
          }
          const sku = `SKU-${item.itemName.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;
          invItem = await tx.item.create({
            data: {
              tenantId: actualTenantId,
              categoryId: category.id,
              unitId: unit.id,
              sku,
              name: item.itemName,
              status: 'active'
            }
          });
        }

        await tx.inventoryStock.upsert({
          where: { warehouseId_itemId: { warehouseId: warehouse.id, itemId: invItem.id } },
          create: {
            tenantId: actualTenantId,
            warehouseId: warehouse.id,
            itemId: invItem.id,
            quantity: toApprove
          },
          update: {
            quantity: { increment: toApprove }
          }
        });

        await tx.stockMovement.create({
          data: {
            tenantId: actualTenantId,
            warehouseId: warehouse.id,
            itemId: invItem.id,
            movementType: 'IN',
            quantity: toApprove,
            referenceType: 'GRN',
            remarks: `Approved PO receipt for ${po.poNumber}`
          }
        });
      }
    }

    const updatedItems = await tx.purchaseRequestItem.findMany({
      where: { purchaseRequestId: po.purchaseRequestId }
    });

    let isFullyReceived = true;
    for (const item of updatedItems) {
      if (item.receivedQty < item.quantity) {
        isFullyReceived = false;
      }
    }

    const updatedPO = await tx.purchaseOrder.update({
      where: { id },
      data: {
        status: isFullyReceived ? 'Completed' : 'Partially Received',
        adminApproved: true
      },
      include: {
        vendor: true,
        purchaseRequest: { include: { items: true, department: true } },
        quotation: true
      }
    });

    return updatedPO;
  });

  await logAudit({
    module: 'PURCHASE_ORDERS',
    action: 'APPROVE_RECEIPT',
    description: `Approved goods receipt for PO ${po.poNumber}`,
    newValue: result,
    performedBy: performerId
  });

  const itemsList = result.purchaseRequest?.items || [];
  const mappedItems = itemsList.map(item => ({
    id: item.id,
    name: item.itemName || item.name || '',
    orderedQty: item.quantity || item.qty || 0,
    price: item.estimatedCost || item.price || 0,
    category: item.category || 'General',
    receivedQty: item.receivedQty || 0,
    pending_receive_qty: item.pendingReceiveQty || 0,
    pendingQty: Math.max(0, (item.quantity || item.qty || 0) - (item.receivedQty || 0) - (item.pendingReceiveQty || 0))
  }));

  return {
    ...result,
    items: mappedItems
  };
};
