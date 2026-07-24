import * as securityService from '../services/security.service.js';
import { sendResponse } from '../utils/response.js';

export const reportSecurityEvent = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId || 1;
    const reporterName = req.user.name || req.user.firstName || 'Unknown User';
    
    const event = await securityService.createSecurityEvent(req.body, tenantId, reporterName);
    sendResponse(res, 201, 'Security event logged successfully', event);
  } catch (error) {
    next(error);
  }
};

export const getSecurityEvents = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId || 1;
    const events = await securityService.getSecurityEvents(tenantId);
    sendResponse(res, 200, 'Security events fetched successfully', events);
  } catch (error) {
    next(error);
  }
};

export const resolveSecurityEvent = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId || 1;
    const event = await securityService.resolveSecurityEvent(req.params.id, tenantId);
    sendResponse(res, 200, 'Security event resolved successfully', event);
  } catch (error) {
    next(error);
  }
};
