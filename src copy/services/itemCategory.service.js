import * as categoryRepo from '../repositories/itemCategory.repository.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';

export const createItemCategory = async (data, performerId, tenantId) => {
  const newCategory = await categoryRepo.createItemCategory({ ...data, tenantId });

  await logAudit({
    module: 'ITEMS',
    action: 'CREATE',
    description: `Created Item Category ${newCategory.name}`,
    newValue: newCategory,
    performedBy: performerId
  });

  return newCategory;
};

export const getItemCategories = async (tenantId, query) => {
  return await categoryRepo.findAllItemCategories(tenantId, query);
};

export const getItemCategoryById = async (id, tenantId) => {
  const category = await categoryRepo.findItemCategoryById(id);
  if (!category || (tenantId !== null && category.tenantId !== tenantId)) {
    throw new AppError('Item Category not found', 404);
  }
  return category;
};

export const updateItemCategory = async (id, data, tenantId, performerId) => {
  const category = await getItemCategoryById(id, tenantId);
  const updatedCategory = await categoryRepo.updateItemCategory(id, data);

  await logAudit({
    module: 'ITEMS',
    action: 'UPDATE',
    description: `Updated Item Category ${category.name}`,
    oldValue: category,
    newValue: updatedCategory,
    performedBy: performerId
  });

  return updatedCategory;
};

export const deleteItemCategory = async (id, tenantId, performerId) => {
  const category = await getItemCategoryById(id, tenantId);
  await categoryRepo.deleteItemCategory(id);

  await logAudit({
    module: 'ITEMS',
    action: 'DELETE',
    description: `Deleted Item Category ${category.name}`,
    oldValue: category,
    performedBy: performerId
  });

  return true;
};
