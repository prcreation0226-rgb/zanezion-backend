import prisma from '../config/db.js';

const mapItem = (req) => {
  if (!req) return req;
  const { metadata, ...rest } = req;
  const metadataObj = typeof metadata === 'string' ? JSON.parse(metadata) : (metadata || {});
  return { ...rest, ...metadataObj, metadata: metadataObj };
};

export const createItem = async (data) => {
  const validDbKeys = ['itemId', 'name', 'category', 'price', 'status', 'tenantId'];
  const dbData = {};
  const metadataExt = {};
  Object.keys(data).forEach(key => {
    if (validDbKeys.includes(key)) {
      dbData[key] = data[key];
    } else {
      metadataExt[key] = data[key];
    }
  });
  const item = await prisma.luxuryItem.create({ data: { ...dbData, metadata: metadataExt } });
  return mapItem(item);
};

export const findAllItems = async (tenantId) => {
  const items = await prisma.luxuryItem.findMany({ where: { ...(tenantId !== null && { tenantId }) }, orderBy: { createdAt: 'desc' } });
  return items.map(mapItem);
};

export const findItemById = async (itemId, tenantId) => {
  let item;
  if (tenantId === null) {
    item = await prisma.luxuryItem.findFirst({ where: { itemId } });
  } else {
    item = await prisma.luxuryItem.findUnique({ where: { itemId_tenantId: { itemId, tenantId } } });
  }
  return mapItem(item);
};

export const updateItem = async (itemId, tenantId, data) => {
  const existing = await findItemById(itemId, tenantId);
  if (!existing) return null;

  const validDbKeys = ['name', 'category', 'price', 'status', 'tenantId'];
  const dbData = {};
  const metadataExt = {};
  Object.keys(data).forEach(key => {
    if (validDbKeys.includes(key)) {
      dbData[key] = data[key];
    } else {
      metadataExt[key] = data[key];
    }
  });

  const finalMetadata = {
    ...(existing.metadata || {}),
    ...metadataExt
  };

  const updated = await prisma.luxuryItem.update({ where: { id: existing.id }, data: { ...dbData, metadata: finalMetadata } });
  return mapItem(updated);
};

export const deleteItem = async (itemId, tenantId) => {
  if (tenantId === null) {
    const existing = await prisma.luxuryItem.findFirst({ where: { itemId } });
    if (!existing) return null;
    return await prisma.luxuryItem.delete({ where: { id: existing.id } });
  }
  return await prisma.luxuryItem.delete({ where: { itemId_tenantId: { itemId, tenantId } } });
};
