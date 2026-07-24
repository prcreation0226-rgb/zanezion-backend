import * as prService from '../services/purchaseRequest.service.js';
import { sendResponse } from '../utils/response.js';
import { resolveTenantId } from '../utils/tenantResolver.js';

export const createPurchaseRequest = async (req, res, next) => {
  try {
    console.log('CREATE PR REQUEST BODY:', req.body);
    try {
      import('fs').then(fs => {
        fs.writeFileSync('debug_pr_payload.json', JSON.stringify({ body: req.body, user: req.user }, null, 2));
      });
    } catch (e) {}
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToUse = isSuperAdmin ? (req.body.tenantId || req.user.tenantId || 1) : (req.user.tenantId || 1);

    const pr = await prService.createPurchaseRequest(req.body, req.user.id, tenantIdToUse);
    sendResponse(res, 201, 'Purchase Request created successfully', pr);
  } catch (error) {
    next(error);
  }
};

export const getPurchaseRequests = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const result = await prService.getPurchaseRequests(tenantIdToFilter, req.query, req.user);
    
    // Inject created_by from embedded userId in description for frontend filtering
    if (result && Array.isArray(result.purchaseRequests)) {
      result.purchaseRequests = result.purchaseRequests.map(pr => {
        let created_by = pr.requestedBy;
        if (pr.description && pr.description.startsWith('[userId:')) {
          const match = pr.description.match(/^\[userId:(\d+)\]\s*(.*)/);
          if (match) {
            created_by = Number(match[1]);
            pr.description = match[2];
          }
        }
        return { ...pr, created_by };
      });
    }

    sendResponse(res, 200, 'Purchase Requests fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getPurchaseRequestById = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const pr = await prService.getPurchaseRequestById(Number(req.params.id), tenantIdToFilter);
    let created_by = pr.requestedBy;
    if (pr.description && pr.description.startsWith('[userId:')) {
      const match = pr.description.match(/^\[userId:(\d+)\]\s*(.*)/);
      if (match) {
        created_by = Number(match[1]);
        pr.description = match[2];
      }
    }
    const safePr = { ...pr, created_by };
    
    sendResponse(res, 200, 'Purchase Request fetched successfully', safePr);
  } catch (error) {
    next(error);
  }
};

export const updatePurchaseRequest = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    const updatedPr = await prService.updatePurchaseRequest(Number(req.params.id), req.body, tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Purchase Request updated successfully', updatedPr);
  } catch (error) {
    next(error);
  }
};

export const updatePurchaseRequestStatus = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);
    const { status } = req.body;

    const updatedPr = await prService.updatePurchaseRequestStatus(Number(req.params.id), status, tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Purchase Request status updated', updatedPr);
  } catch (error) {
    next(error);
  }
};

export const deletePurchaseRequest = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantId(req);

    await prService.deletePurchaseRequest(Number(req.params.id), tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Purchase Request deleted successfully');
  } catch (error) {
    next(error);
  }
};
