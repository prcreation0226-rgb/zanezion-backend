import * as unitRepo from '../repositories/itemUnit.repository.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';

export const createItemUnit = async (data, performerId, tenantId) => {
  const newUnit = await unitRepo.createItemUnit({ ...data, tenantId });

  await logAudit({
    module: 'ITEMS',
    action: 'CREATE',
    description: `Created Item Unit ${newUnit.name}`,
    newValue: newUnit,
    performedBy: performerId
  });

  return newUnit;
};

export const getItemUnits = async (tenantId, query) => {
  return await unitRepo.findAllItemUnits(tenantId, query);
};

export const getItemUnitById = async (id, tenantId) => {
  const unit = await unitRepo.findItemUnitById(id);
  if (!unit || (tenantId !== null && unit.tenantId !== tenantId)) {
    throw new AppError('Item Unit not found', 404);
  }
  return unit;
};

export const updateItemUnit = async (id, data, tenantId, performerId) => {
  const unit = await getItemUnitById(id, tenantId);
  const updatedUnit = await unitRepo.updateItemUnit(id, data);

  await logAudit({
    module: 'ITEMS',
    action: 'UPDATE',
    description: `Updated Item Unit ${unit.name}`,
    oldValue: unit,
    newValue: updatedUnit,
    performedBy: performerId
  });

  return updatedUnit;
};

export const deleteItemUnit = async (id, tenantId, performerId) => {
  const unit = await getItemUnitById(id, tenantId);
  await unitRepo.deleteItemUnit(id);

  await logAudit({
    module: 'ITEMS',
    action: 'DELETE',
    description: `Deleted Item Unit ${unit.name}`,
    oldValue: unit,
    performedBy: performerId
  });

  return true;
};
