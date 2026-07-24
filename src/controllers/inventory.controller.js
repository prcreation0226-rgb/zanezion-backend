import * as inventoryService from '../services/inventory.service.js';
import { sendResponse } from '../utils/response.js';
import prisma from '../config/db.js';

import { resolveTenantId } from '../utils/tenantResolver.js';
export const issueStock = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const isBusinessClient = req.user.role?.name === 'BUSINESS_CLIENT' || req.user.role?.name === 'CLIENT';
    const tenantIdToUse = isSuperAdmin ? (req.body.tenantId || req.user.tenantId || 1) : (req.user.tenantId || 1);

    const result = await inventoryService.issueStock(req.body, req.user.id, tenantIdToUse, isBusinessClient);
    sendResponse(res, 200, 'Stock issued successfully', result);
  } catch (error) {
    next(error);
  }
};

export const recordLoss = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const isBusinessClient = req.user.role?.name === 'BUSINESS_CLIENT' || req.user.role?.name === 'CLIENT';
    const tenantIdToUse = isSuperAdmin ? (req.body.tenantId || req.user.tenantId || 1) : (req.user.tenantId || 1);

    const result = await inventoryService.recordLoss(req.body, req.user.id, tenantIdToUse, isBusinessClient);
    sendResponse(res, 200, 'Strategic loss assessment recorded successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getLossAssessments = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const result = await inventoryService.getLossAssessments(tenantIdToFilter, req.query);
    sendResponse(res, 200, 'Strategic loss assessments fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

const checkIsClient = (user) => {
  const roleName = String(user?.role?.name || user?.role || '').toUpperCase();
  if (roleName === 'SAAS_CLIENT') return false;
  return roleName.includes('CLIENT') || roleName.includes('CUSTOMER');
};

export const getInventory = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const isClient = checkIsClient(req.user);
    const isSaaSTenant = req.user.tenantId && Number(req.user.tenantId) !== 1;
    const tenantId = isSuperAdmin ? null :
                     isClient ? [1, req.user.tenantId].filter(t => t !== null && t !== undefined).map(Number) :
                     isSaaSTenant ? Number(req.user.tenantId) :
                     (req.user.tenantId || 1);

    const items = await prisma.item.findMany({
      where: {
        ...(tenantId !== null && (Array.isArray(tenantId) ? { tenantId: { in: tenantId } } : { tenantId })),
      },
      include: {
        category: true,
        unit: true,
        inventoryStock: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    const result = items.map((item) => {
      const totalQty = item.inventoryStock.reduce((sum, stock) => sum + stock.quantity, 0);
      const firstStock = item.inventoryStock[0];
      const warehouseName = firstStock?.warehouse?.name || 'General Storage';
      
      return {
        id: item.id,
        name: item.name,
        description: item.description,
        sku: item.sku,
        qty: totalQty,
        quantity: totalQty,
        price: item.price,
        status: item.status,
        inventoryType: item.inventoryType,
        inventory_type: item.inventoryType,
        location: warehouseName,
        warehouse_name: warehouseName,
        category: item.category?.name || 'General',
        unit: item.unit?.name || 'Piece',
        clientId: item.clientId,
        client_id: item.clientId,
      };
    });

    sendResponse(res, 200, 'Inventory fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

