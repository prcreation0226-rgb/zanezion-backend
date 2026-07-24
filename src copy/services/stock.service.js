import * as stockRepo from '../repositories/stock.repository.js';
import * as warehouseRepo from '../repositories/warehouse.repository.js';
import * as itemRepo from '../repositories/item.repository.js';
import prisma from '../config/db.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';

export const processGRNStock = async (tenantId, warehouseId, itemId, quantity, grnId, performerId) => {
  return await prisma.$transaction(async (tx) => {
    const updatedStock = await stockRepo.upsertStock(tx, tenantId, warehouseId, itemId, quantity);
    
    await stockRepo.recordMovement(tx, {
      tenantId,
      warehouseId,
      itemId,
      movementType: 'IN',
      quantity,
      referenceType: 'GRN',
      referenceId: grnId,
      remarks: 'Stock received from GRN'
    });

    return updatedStock;
  });
};

export const adjustStock = async (data, performerId, tenantId) => {
  const { warehouseId, itemId, quantity, type, remarks } = data;

  const warehouse = await warehouseRepo.findWarehouseById(warehouseId);
  if (!warehouse || (tenantId !== null && warehouse.tenantId !== tenantId)) {
    throw new AppError('Warehouse not found', 404);
  }

  const item = await itemRepo.findItemById(itemId);
  if (!item || (tenantId !== null && item.tenantId !== tenantId)) {
    throw new AppError('Item not found', 404);
  }

  const quantityChange = type === 'ADD' ? quantity : -quantity;

  if (type === 'DEDUCT') {
    const currentStock = await stockRepo.getStock(warehouseId, itemId);
    if (!currentStock || currentStock.quantity < quantity) {
      throw new AppError('Insufficient stock for deduction', 400);
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedStock = await stockRepo.upsertStock(tx, tenantId, warehouseId, itemId, quantityChange);
    
    await stockRepo.recordMovement(tx, {
      tenantId,
      warehouseId,
      itemId,
      movementType: data.movementType || 'ADJUSTMENT',
      quantity: quantityChange,
      referenceType: data.referenceType || 'MANUAL',
      remarks
    });

    return updatedStock;
  });

  await logAudit({
    module: 'STOCK',
    action: 'ADJUST',
    description: `Manually ${type === 'ADD' ? 'added' : 'deducted'} ${quantity} of ${item.name} at ${warehouse.name}`,
    newValue: result,
    performedBy: performerId
  });

  return result;
};

export const transferStock = async (data, performerId, tenantId) => {
  const { sourceWarehouseId, destinationWarehouseId, itemId, quantity, remarks } = data;

  if (sourceWarehouseId === destinationWarehouseId) {
    throw new AppError('Source and Destination warehouse cannot be same', 400);
  }

  const sourceWarehouse = await warehouseRepo.findWarehouseById(sourceWarehouseId);
  const destWarehouse = await warehouseRepo.findWarehouseById(destinationWarehouseId);

  if (!sourceWarehouse || (tenantId !== null && sourceWarehouse.tenantId !== tenantId)) throw new AppError('Source warehouse not found', 404);
  if (!destWarehouse || (tenantId !== null && destWarehouse.tenantId !== tenantId)) throw new AppError('Destination warehouse not found', 404);

  const currentStock = await stockRepo.getStock(sourceWarehouseId, itemId);
  if (!currentStock || currentStock.quantity < quantity) {
    throw new AppError('Insufficient stock at source warehouse for transfer', 400);
  }

  const item = await itemRepo.findItemById(itemId);

  const result = await prisma.$transaction(async (tx) => {
    // Deduct from Source
    await stockRepo.upsertStock(tx, tenantId, sourceWarehouseId, itemId, -quantity);
    await stockRepo.recordMovement(tx, {
      tenantId,
      warehouseId: sourceWarehouseId,
      itemId,
      movementType: 'TRANSFER_OUT',
      quantity: -quantity,
      referenceType: 'TRANSFER',
      remarks: `Transferred to ${destWarehouse.name}. ${remarks || ''}`
    });

    // Add to Destination
    const updatedDestStock = await stockRepo.upsertStock(tx, tenantId, destinationWarehouseId, itemId, quantity);
    await stockRepo.recordMovement(tx, {
      tenantId,
      warehouseId: destinationWarehouseId,
      itemId,
      movementType: 'TRANSFER_IN',
      quantity,
      referenceType: 'TRANSFER',
      remarks: `Transferred from ${sourceWarehouse.name}. ${remarks || ''}`
    });

    return updatedDestStock;
  });

  await logAudit({
    module: 'STOCK',
    action: 'TRANSFER',
    description: `Transferred ${quantity} of ${item?.name} from ${sourceWarehouse.name} to ${destWarehouse.name}`,
    performedBy: performerId
  });

  return result;
};

export const getStock = async (tenantId, query) => {
  return await stockRepo.findAllStock(tenantId, query);
};

export const getMovements = async (tenantId, query) => {
  return await stockRepo.findAllMovements(tenantId, query);
};
