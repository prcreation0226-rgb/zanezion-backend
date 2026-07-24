import prisma from '../config/db.js';
import AppError from '../utils/AppError.js';
import * as stockRepo from '../repositories/stock.repository.js';
import * as warehouseRepo from '../repositories/warehouse.repository.js';
import * as itemRepo from '../repositories/item.repository.js';
import { logAudit } from '../utils/audit.js';

export const issueStock = async (data, performerId, tenantId) => {
  const { warehouseId, itemId, quantity, issuedBy, issuedTo, clientId, remarks } = data;

  const warehouse = await warehouseRepo.findWarehouseById(warehouseId);
  if (!warehouse || (tenantId !== null && warehouse.tenantId !== tenantId)) {
    throw new AppError('Warehouse not found', 404);
  }

  const item = await itemRepo.findItemById(itemId);
  if (!item || (tenantId !== null && item.tenantId !== tenantId)) {
    throw new AppError('Item not found', 404);
  }

  const currentStock = await stockRepo.getStock(warehouseId, itemId);
  if (!currentStock || currentStock.quantity < quantity) {
    throw new AppError('Insufficient stock for outbound issue', 400);
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Deduct stock quantity
    const updatedStock = await stockRepo.upsertStock(tx, tenantId, warehouseId, itemId, -quantity);

    // 2. Write Stock Movement log (STOCK_ISSUE)
    await stockRepo.recordMovement(tx, {
      tenantId,
      warehouseId,
      itemId,
      movementType: 'OUT',
      quantity: -quantity,
      referenceType: 'MANUAL',
      remarks: `Issued to: ${issuedTo} | Ref: ${issuedBy}. Notes: ${remarks || 'None'}`
    });

    return updatedStock;
  });

  await logAudit({
    module: 'INVENTORY',
    action: 'ADJUST',
    description: `Issued ${quantity} units of ${item.name} at ${warehouse.name} to ${issuedTo}`,
    newValue: result,
    performedBy: performerId
  });

  return result;
};

export const recordLoss = async (data, performerId, tenantId) => {
  const { warehouseId, itemId, quantity, lossType, explanation, reportedBy, investigationStatus, evidenceUrl } = data;

  const warehouse = await warehouseRepo.findWarehouseById(warehouseId);
  if (!warehouse || (tenantId !== null && warehouse.tenantId !== tenantId)) {
    throw new AppError('Warehouse not found', 404);
  }

  const item = await itemRepo.findItemById(itemId);
  if (!item || (tenantId !== null && item.tenantId !== tenantId)) {
    throw new AppError('Item not found', 404);
  }

  const currentStock = await stockRepo.getStock(warehouseId, itemId);
  if (!currentStock || currentStock.quantity < quantity) {
    throw new AppError('Insufficient stock for strategic loss assessment', 400);
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Deduct stock quantity
    await stockRepo.upsertStock(tx, tenantId, warehouseId, itemId, -quantity);

    // 2. Create LossAssessment record (No StockMovement created)
    const lossRecord = await tx.lossAssessment.create({
      data: {
        tenantId,
        warehouseId,
        itemId,
        quantity,
        lossType,
        explanation,
        reportedBy,
        investigationStatus: investigationStatus || 'Pending',
        evidenceUrl: evidenceUrl || null
      }
    });

    return lossRecord;
  });

  await logAudit({
    module: 'INVENTORY',
    action: 'ADJUST',
    description: `Recorded strategic loss of ${quantity} units of ${item.name} (${lossType}) at ${warehouse.name}`,
    newValue: result,
    performedBy: performerId
  });

  return result;
};

export const getLossAssessments = async (tenantId, query) => {
  const { page = 1, limit = 10, warehouseId, itemId } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(tenantId !== null && { tenantId }),
    ...(warehouseId && { warehouseId: Number(warehouseId) }),
    ...(itemId && { itemId: Number(itemId) })
  };

  const [losses, total] = await Promise.all([
    prisma.lossAssessment.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        warehouse: { select: { name: true } },
        item: { select: { name: true, sku: true, price: true } }
      }
    }),
    prisma.lossAssessment.count({ where })
  ]);

  return { losses, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};
