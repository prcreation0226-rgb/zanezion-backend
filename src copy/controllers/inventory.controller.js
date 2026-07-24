import * as inventoryService from '../services/inventory.service.js';
import { sendResponse } from '../utils/response.js';
import prisma from '../config/db.js';

export const issueStock = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToUse = isSuperAdmin ? (req.body.tenantId || req.user.tenantId || 1) : (req.user.tenantId || 1);

    const result = await inventoryService.issueStock(req.body, req.user.id, tenantIdToUse);
    sendResponse(res, 200, 'Stock issued successfully', result);
  } catch (error) {
    next(error);
  }
};

export const recordLoss = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToUse = isSuperAdmin ? (req.body.tenantId || req.user.tenantId || 1) : (req.user.tenantId || 1);

    const result = await inventoryService.recordLoss(req.body, req.user.id, tenantIdToUse);
    sendResponse(res, 200, 'Strategic loss assessment recorded successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getLossAssessments = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin && !req.query.tenantId ? null : (req.query.tenantId ? Number(req.query.tenantId) : req.user.tenantId);

    const result = await inventoryService.getLossAssessments(tenantIdToFilter, req.query);
    sendResponse(res, 200, 'Strategic loss assessments fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getInventory = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantId = isSuperAdmin ? null : (req.user.tenantId || 1);

    const items = await prisma.item.findMany({
      where: {
        ...(tenantId !== null && { tenantId }),
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

