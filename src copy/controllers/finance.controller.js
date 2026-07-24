import * as financeService from '../services/finance.service.js';
import { sendResponse } from '../utils/response.js';

export const getPayrolls = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const isAdmin = req.user.role?.name === 'ADMIN';
    const tenantIdToFilter = isSuperAdmin && !req.query.tenantId ? null : (req.query.tenantId ? Number(req.query.tenantId) : req.user.tenantId);
    
    // Non-admins can only see their own payroll records
    const filterUserId = (isSuperAdmin || isAdmin) ? null : req.user.id;
    const payrolls = await financeService.getPayrolls(tenantIdToFilter || 1, filterUserId);
    
    // Transform to match frontend expectations
    const formattedData = payrolls.map(p => ({
      ...p,
      user_id: p.userId,
      user_name: p.user?.name,
      base_salary: p.baseSalary,
      nib_deduction: p.nibDeduction,
      medical_deduction: p.medicalDeduction,
      pension_deduction: p.pensionDeduction,
      savings_deduction: p.savingsDeduction,
      birthday_club: p.birthdayClub,
      net_amount: p.netAmount,
      payment_date: p.paymentDate,
      created_at: p.createdAt
    }));

    sendResponse(res, 200, 'Payrolls fetched successfully', formattedData);
  } catch (error) {
    next(error);
  }
};

export const createPayroll = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const isAdmin = req.user.role?.name === 'ADMIN';
    if (!isSuperAdmin && !isAdmin) {
      throw new AppError('Access denied. Admin permissions required.', 403);
    }
    const tenantIdToUse = isSuperAdmin ? (req.body.tenantId || req.user.tenantId || 1) : (req.user.tenantId || 1);
    
    const payroll = await financeService.createPayroll(tenantIdToUse, req.user.id, req.body);
    sendResponse(res, 201, 'Payroll created successfully', payroll);
  } catch (error) {
    next(error);
  }
};

export const updatePayroll = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const isAdmin = req.user.role?.name === 'ADMIN';
    if (!isSuperAdmin && !isAdmin) {
      throw new AppError('Access denied. Admin permissions required.', 403);
    }
    const tenantIdToUse = isSuperAdmin ? (req.body.tenantId || req.user.tenantId || 1) : (req.user.tenantId || 1);
    
    const payroll = await financeService.updatePayroll(tenantIdToUse, req.user.id, req.params.id, req.body);
    sendResponse(res, 200, 'Payroll updated successfully', payroll);
  } catch (error) {
    next(error);
  }
};

export const deletePayroll = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';
    const isAdmin = req.user.role?.name === 'ADMIN';
    if (!isSuperAdmin && !isAdmin) {
      throw new AppError('Access denied. Admin permissions required.', 403);
    }
    const tenantIdToUse = isSuperAdmin ? (req.query.tenantId || req.user.tenantId || 1) : (req.user.tenantId || 1);
    
    await financeService.deletePayroll(tenantIdToUse, req.user.id, req.params.id);
    sendResponse(res, 200, 'Payroll deleted successfully');
  } catch (error) {
    next(error);
  }
};
