import * as itemRepo from '../repositories/item.repository.js';
import * as categoryRepo from '../repositories/itemCategory.repository.js';
import * as unitRepo from '../repositories/itemUnit.repository.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';
import prisma from '../config/db.js';

export const createItem = async (data, performerId, tenantId) => {
  // Check category
  const category = await categoryRepo.findItemCategoryById(data.categoryId);
  if (!category || (tenantId !== null && category.tenantId !== tenantId)) {
    throw new AppError('Category not found', 404);
  }

  // Check unit
  const unit = await unitRepo.findItemUnitById(data.unitId);
  if (!unit || (tenantId !== null && unit.tenantId !== tenantId)) {
    throw new AppError('Unit not found', 404);
  }

  // Auto-generate SKU if not provided
  const finalSku = data.sku || ('SKU-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000));

  // Check unique SKU per tenant
  const existingItem = await itemRepo.findItemBySku(finalSku, tenantId);
  if (existingItem) {
    throw new AppError('Item with this SKU already exists', 400);
  }

  const createPayload = { ...data, sku: finalSku, tenantId };

  if (data.qty && data.warehouseId) {
    createPayload.inventoryStock = {
      create: {
        warehouseId: Number(data.warehouseId),
        quantity: Number(data.qty),
        tenantId
      }
    };
  }

  // Remove qty and warehouseId from root level so Prisma doesn't complain
  delete createPayload.qty;
  delete createPayload.warehouseId;


  const newItem = await itemRepo.createItem(createPayload);

  await logAudit({
    module: 'ITEMS',
    action: 'CREATE',
    description: `Created Item ${newItem.name} (SKU: ${newItem.sku})`,
    newValue: newItem,
    performedBy: performerId
  });

  return newItem;
};

export const getItems = async (tenantId, query) => {
  return await itemRepo.findAllItems(tenantId, query);
};

export const getItemById = async (id, tenantId) => {
  const item = await itemRepo.findItemById(id);
  if (!item || (tenantId !== null && item.tenantId !== tenantId)) {
    throw new AppError('Item not found', 404);
  }
  return item;
};

export const updateItem = async (id, data, tenantId, performerId) => {
  const item = await getItemById(id, tenantId);

  if (data.sku && data.sku !== item.sku) {
    const existingItem = await itemRepo.findItemBySku(data.sku, tenantId);
    if (existingItem) {
      throw new AppError('Item with this SKU already exists', 400);
    }
  }

  const updatePayload = { ...data };
  const qty = updatePayload.qty !== undefined ? Number(updatePayload.qty) : null;
  const warehouseId = updatePayload.warehouseId ? parseInt(updatePayload.warehouseId, 10) : null;

  delete updatePayload.qty;
  delete updatePayload.warehouseId;

  const updatedItem = await itemRepo.updateItem(id, updatePayload);

  if (qty !== null && warehouseId !== null && !isNaN(warehouseId)) {
    // Relocate/update inventory stock records for this item
    await prisma.inventoryStock.deleteMany({
      where: { itemId: id }
    });

    await prisma.inventoryStock.create({
      data: {
        itemId: id,
        warehouseId,
        quantity: qty,
        tenantId: tenantId || item.tenantId || 1
      }
    });
  }

  await logAudit({
    module: 'ITEMS',
    action: 'UPDATE',
    description: `Updated Item ${item.name}`,
    oldValue: item,
    newValue: updatedItem,
    performedBy: performerId
  });

  return updatedItem;
};

export const deleteItem = async (id, tenantId, performerId) => {
  const item = await getItemById(id, tenantId);
  await itemRepo.deleteItem(id);

  await logAudit({
    module: 'ITEMS',
    action: 'DELETE',
    description: `Deleted Item ${item.name}`,
    oldValue: item,
    performedBy: performerId
  });

  return true;
};
