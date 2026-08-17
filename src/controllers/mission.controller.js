import * as missionService from '../services/mission.service.js';
import { sendResponse } from '../utils/response.js';

import { resolveTenantId, resolveTenantIdForOperations } from '../utils/tenantResolver.js';

export const createMission = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToUse = isSuperAdmin ? (req.body.tenantId || req.user.tenantId || 1) : (req.user.tenantId || 1);

    let empId = req.body.assignedEmployeeId || req.body.assigneeId;
    empId = empId ? parseInt(empId, 10) : (req.user.id || 1);

    const { deliveryId, assignedEmployeeId, assigneeId, remarks, tenantId, ...metadata } = req.body;
    
    const missionPayload = {
      deliveryId: deliveryId ? parseInt(deliveryId, 10) : undefined,
      assignedEmployeeId: empId,
      remarks: remarks || '',
      metadata: metadata,
      missionType: metadata.missionType || 'LOGISTICS'
    };

    const mission = await missionService.createMission(missionPayload, req.user.id, tenantIdToUse);
    sendResponse(res, 201, 'Mission created successfully', mission);
  } catch (error) {
    next(error);
  }
};

export const getMissions = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantIdForOperations(req);

    const result = await missionService.getMissions(tenantIdToFilter, req.query);
    sendResponse(res, 200, 'Missions fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getMissionById = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantIdForOperations(req);

    const mission = await missionService.getMissionById(req.params.id, tenantIdToFilter);
    sendResponse(res, 200, 'Mission fetched successfully', mission);
  } catch (error) {
    next(error);
  }
};

export const startMission = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantIdForOperations(req);

    await missionService.startMission(req.params.id, tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Mission started and delivery dispatched successfully');
  } catch (error) {
    next(error);
  }
};

export const submitPOD = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantIdForOperations(req);

    await missionService.submitPOD(req.params.id, req.body, tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Proof of Delivery submitted and mission completed successfully');
  } catch (error) {
    next(error);
  }
};

export const convertProjectToMission = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantIdForOperations(req);
    const projectId = Number(req.params.projectId);

    const mission = await missionService.convertProjectToMission(projectId, req.body, tenantIdToFilter, req.user.id);
    sendResponse(res, 201, 'Project converted to Mission successfully', mission);
  } catch (error) {
    next(error);
  }
};

export const convertOrderToMission = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantIdForOperations(req);
    const orderId = Number(req.params.orderId);

    const mission = await missionService.convertOrderToMission(orderId, req.body, tenantIdToFilter, req.user.id);
    sendResponse(res, 201, 'Order converted to Mission successfully', mission);
  } catch (error) {
    next(error);
  }
};

export const assignMission = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantIdForOperations(req);
    const missionId = req.params.id;

    const mission = await missionService.assignMission(missionId, req.body, tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Mission assigned successfully', mission);
  } catch (error) {
    next(error);
  }
};

export const updateMissionStatus = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantIdForOperations(req);
    const missionId = req.params.id;
    const { status } = req.body;

    const mission = await missionService.updateMissionStatus(missionId, status, tenantIdToFilter, req.user?.id || 1);
    sendResponse(res, 200, 'Mission status updated successfully', mission);
  } catch (error) {
    next(error);
  }
};

export const deleteMission = async (req, res, next) => {
  try {
    const tenantIdToFilter = resolveTenantIdForOperations(req);
    await missionService.deleteMission(req.params.id, tenantIdToFilter, req.user?.id || 1);
    sendResponse(res, 200, 'Mission deleted successfully', []);
  } catch (error) {
    next(error);
  }
};
