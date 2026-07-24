import * as organizationService from '../services/organization.service.js';
import { sendResponse } from '../utils/response.js';

export const createOrganization = async (req, res, next) => {
  try {
    const org = await organizationService.createOrganization(req.body, req.user.id);
    sendResponse(res, 201, 'Organization created successfully', org);
  } catch (error) {
    next(error);
  }
};

export const getOrganizations = async (req, res, next) => {
  try {
    const orgs = await organizationService.getOrganizations(req.query);
    sendResponse(res, 200, 'Organizations fetched successfully', orgs);
  } catch (error) {
    next(error);
  }
};

export const getOrganizationById = async (req, res, next) => {
  try {
    const org = await organizationService.getOrganizationById(Number(req.params.id));
    sendResponse(res, 200, 'Organization fetched successfully', org);
  } catch (error) {
    next(error);
  }
};

export const updateOrganization = async (req, res, next) => {
  try {
    const org = await organizationService.updateOrganization(Number(req.params.id), req.body, req.user.id);
    sendResponse(res, 200, 'Organization updated successfully', org);
  } catch (error) {
    next(error);
  }
};

export const suspendOrganization = async (req, res, next) => {
  try {
    const org = await organizationService.suspendOrganization(Number(req.params.id), req.user.id);
    sendResponse(res, 200, 'Organization suspended successfully', org);
  } catch (error) {
    next(error);
  }
};

export const activateOrganization = async (req, res, next) => {
  try {
    const org = await organizationService.activateOrganization(Number(req.params.id), req.user.id);
    sendResponse(res, 200, 'Organization activated successfully', org);
  } catch (error) {
    next(error);
  }
};
