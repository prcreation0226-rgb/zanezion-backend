import * as planService from '../services/plan.service.js';
import { sendResponse } from '../utils/response.js';

export const createPlan = async (req, res, next) => {
  try {
    const plan = await planService.createPlan(req.body, req.user.id);
    sendResponse(res, 201, 'Plan created successfully', plan);
  } catch (error) {
    next(error);
  }
};

export const getPlans = async (req, res, next) => {
  try {
    const plans = await planService.getPlans(req.query);
    sendResponse(res, 200, 'Plans fetched successfully', plans);
  } catch (error) {
    next(error);
  }
};

export const getPublicPlans = async (req, res, next) => {
  try {
    // Force isActive to 'true' for public requests
    const plans = await planService.getPlans({ ...req.query, isActive: 'true', limit: 100 });
    sendResponse(res, 200, 'Public plans fetched successfully', plans);
  } catch (error) {
    next(error);
  }
};

export const getPlanById = async (req, res, next) => {
  try {
    const plan = await planService.getPlanById(Number(req.params.id));
    sendResponse(res, 200, 'Plan fetched successfully', plan);
  } catch (error) {
    next(error);
  }
};

export const updatePlan = async (req, res, next) => {
  try {
    const plan = await planService.updatePlan(Number(req.params.id), req.body, req.user.id);
    sendResponse(res, 200, 'Plan updated successfully', plan);
  } catch (error) {
    next(error);
  }
};

export const activatePlan = async (req, res, next) => {
  try {
    const plan = await planService.activatePlan(Number(req.params.id), req.user.id);
    sendResponse(res, 200, 'Plan activated successfully', plan);
  } catch (error) {
    next(error);
  }
};

export const deactivatePlan = async (req, res, next) => {
  try {
    const plan = await planService.deactivatePlan(Number(req.params.id), req.user.id);
    sendResponse(res, 200, 'Plan deactivated successfully', plan);
  } catch (error) {
    next(error);
  }
};

export const deletePlan = async (req, res, next) => {
  try {
    await planService.deletePlan(Number(req.params.id), req.user.id);
    sendResponse(res, 200, 'Plan deleted successfully');
  } catch (error) {
    next(error);
  }
};
