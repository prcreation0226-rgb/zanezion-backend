import * as vendorService from '../services/vendor.service.js';
import { sendResponse } from '../utils/response.js';
import AppError from '../utils/AppError.js';

export const createVendor = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    let tenantIdToUse = isSuperAdmin ? (req.body.tenantId || req.user.tenantId || 1) : (req.user.tenantId || 1);

    if (!tenantIdToUse) {
      tenantIdToUse = 1; // Fallback to a default tenant ID if none provided
    }

    const payload = req.body;
    
    const vendorData = {
      vendorCode: payload.vendorCode || `VND-${Date.now().toString().slice(-6)}`,
      companyName: payload.companyName || payload.name || "Unknown Company",
      contactPerson: payload.contactPerson || payload.contact || null,
      email: payload.email,
      phone: payload.phone || null,
      address: payload.address || null,
      status: "inactive", // Always default to inactive on create for all roles
      category: payload.category || null,
      rating: payload.rating !== undefined ? Number(payload.rating) : 90,
      delivery: payload.delivery !== undefined ? Number(payload.delivery) : 90
    };

    const vendor = await vendorService.createVendor(vendorData, req.user.id, tenantIdToUse);
    sendResponse(res, 201, 'Vendor created successfully', vendor);
  } catch (error) {
    next(error);
  }
};

export const getVendors = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin && !req.query.tenantId ? null : (req.query.tenantId ? Number(req.query.tenantId) : req.user.tenantId);

    const result = await vendorService.getVendors(tenantIdToFilter, req.query);
    sendResponse(res, 200, 'Vendors fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getVendorById = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);

    const vendor = await vendorService.getVendorById(Number(req.params.id), tenantIdToFilter);
    sendResponse(res, 200, 'Vendor fetched successfully', vendor);
  } catch (error) {
    next(error);
  }
};

export const updateVendor = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);

    const payload = req.body;
    const vendorData = {};

    if (payload.vendorCode !== undefined) vendorData.vendorCode = payload.vendorCode;
    if (payload.companyName !== undefined) vendorData.companyName = payload.companyName;
    if (payload.name !== undefined && !vendorData.companyName) vendorData.companyName = payload.name;
    if (payload.contactPerson !== undefined) vendorData.contactPerson = payload.contactPerson;
    if (payload.contact !== undefined && !vendorData.contactPerson) vendorData.contactPerson = payload.contact;
    if (payload.email !== undefined) vendorData.email = payload.email;
    if (payload.phone !== undefined) vendorData.phone = payload.phone;
    if (payload.address !== undefined) vendorData.address = payload.address;
    const existingVendor = await vendorService.getVendorById(Number(req.params.id), tenantIdToFilter);
    if (payload.status !== undefined && payload.status !== existingVendor.status) {
      if (payload.status === 'active' && !isSuperAdmin) {
        throw new AppError('Only Super Admins can activate vendors', 403);
      }
      vendorData.status = payload.status;
    }
    if (payload.category !== undefined) vendorData.category = payload.category;
    if (payload.rating !== undefined) vendorData.rating = Number(payload.rating);
    if (payload.delivery !== undefined) vendorData.delivery = Number(payload.delivery);

    const updatedVendor = await vendorService.updateVendor(Number(req.params.id), vendorData, tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Vendor updated successfully', updatedVendor);
  } catch (error) {
    next(error);
  }
};

export const deleteVendor = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);

    await vendorService.deleteVendor(Number(req.params.id), tenantIdToFilter, req.user.id);
    sendResponse(res, 200, 'Vendor deleted successfully');
  } catch (error) {
    next(error);
  }
};
