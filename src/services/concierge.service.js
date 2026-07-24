import * as conciergeRepository from '../repositories/concierge.repository.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';

export const createItem = async (data, performerId, tenantId) => {
  let itemId = data.id || `LXY-${Math.floor(1000 + Math.random() * 8999)}`;
  const existing = await conciergeRepository.findItemById(itemId, tenantId);
  if (existing) throw new AppError('Item ID already exists', 400);

  const payload = {
    ...data,
    itemId,
    name: data.name || data.item || data.item_name || 'Luxury Item',
    category: data.category || 'General',
    price: data.price ? parseFloat(data.price) : 0,
    status: data.status || 'Available',
    tenantId
  };

  const item = await conciergeRepository.createItem(payload);
  await logAudit({ module: 'CONCIERGE', action: 'CREATE', description: `Added luxury item ${item.name}`, newValue: item, performedBy: performerId });
  return { ...item, id: item.itemId };
};

export const getItems = async (tenantId) => {
  const items = await conciergeRepository.findAllItems(tenantId);
  return items.map(i => ({ ...i, id: i.itemId }));
};

export const updateItem = async (id, data, tenantId, performerId) => {
  const existing = await conciergeRepository.findItemById(id, tenantId);
  if (!existing) throw new AppError('Item not found', 404);

  const payload = {
    ...data,
    name: data.name !== undefined ? data.name : (data.item_name !== undefined ? data.item_name : existing.name),
    category: data.category !== undefined ? data.category : existing.category,
    price: data.price !== undefined ? parseFloat(data.price) : existing.price,
    status: data.status !== undefined ? data.status : existing.status
  };

  const updated = await conciergeRepository.updateItem(id, tenantId, payload);
  await logAudit({ module: 'CONCIERGE', action: 'UPDATE', description: `Updated luxury item ${updated.name}`, oldValue: existing, newValue: updated, performedBy: performerId });
  return { ...updated, id: updated.itemId };
};

export const deleteItem = async (id, tenantId, performerId) => {
  const existing = await conciergeRepository.findItemById(id, tenantId);
  if (!existing) throw new AppError('Item not found', 404);
  await conciergeRepository.deleteItem(id, tenantId);
  await logAudit({ module: 'CONCIERGE', action: 'DELETE', description: `Deleted luxury item ${existing.name}`, oldValue: existing, performedBy: performerId });
  return true;
};
