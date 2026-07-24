import prisma from '../config/db.js';
import { sendResponse } from '../utils/response.js';

export const getLeaveRequests = async (req, res, next) => {
  try {
    const roleName = req.user?.role?.name || '';
    const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'superadmin', 'admin'].includes(roleName);
    const tenantIdToFilter = isAdmin ? null : req.user?.tenantId;

    const where = {};
    if (tenantIdToFilter) where.tenantId = tenantIdToFilter;

    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mappedData = leaveRequests.map((req) => ({
      id: req.id,
      userId: req.userId,
      name: req.user?.name,
      type: req.leaveType,
      hours: req.hours,
      start: req.startDate.toISOString().split('T')[0],
      end: req.endDate.toISOString().split('T')[0],
      reason: req.reason,
      status: req.status,
      createdAt: req.createdAt,
    }));

    sendResponse(res, 200, 'Leave requests fetched successfully', mappedData);
  } catch (error) {
    next(error);
  }
};

export const createLeaveRequest = async (req, res, next) => {
  try {
    const { user_id, company_id, leave_type, start_date, end_date, reason, hours } = req.body;
    
    // Convert status to capitalization matching the UI if needed
    const newRequest = await prisma.leaveRequest.create({
      data: {
        userId: Number(user_id) || req.user.id,
        tenantId: Number(company_id) || req.user.tenantId,
        leaveType: leave_type,
        startDate: new Date(start_date),
        endDate: new Date(end_date),
        hours: hours ? Number(hours) : null,
        reason: reason,
        status: 'Pending',
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    const mappedData = {
      id: newRequest.id,
      userId: newRequest.userId,
      name: newRequest.user?.name,
      type: newRequest.leaveType,
      hours: newRequest.hours,
      start: newRequest.startDate.toISOString().split('T')[0],
      end: newRequest.endDate.toISOString().split('T')[0],
      reason: newRequest.reason,
      status: newRequest.status,
      createdAt: newRequest.createdAt,
    };

    sendResponse(res, 201, 'Leave request created successfully', mappedData);
  } catch (error) {
    next(error);
  }
};

export const updateLeaveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, leave_type, start_date, end_date, reason, hours } = req.body;

    const dataToUpdate = {};
    if (status) {
      dataToUpdate.status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }
    if (leave_type) dataToUpdate.leaveType = leave_type;
    if (start_date) dataToUpdate.startDate = new Date(start_date);
    if (end_date) dataToUpdate.endDate = new Date(end_date);
    if (reason) dataToUpdate.reason = reason;
    if (hours !== undefined) dataToUpdate.hours = hours ? Number(hours) : null;

    const updatedRequest = await prisma.leaveRequest.update({
      where: { id: Number(id) },
      data: dataToUpdate,
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    const mappedData = {
      id: updatedRequest.id,
      userId: updatedRequest.userId,
      name: updatedRequest.user?.name,
      type: updatedRequest.leaveType,
      hours: updatedRequest.hours,
      start: updatedRequest.startDate.toISOString().split('T')[0],
      end: updatedRequest.endDate.toISOString().split('T')[0],
      reason: updatedRequest.reason,
      status: updatedRequest.status,
      createdAt: updatedRequest.createdAt,
    };

    sendResponse(res, 200, 'Leave request updated successfully', mappedData);
  } catch (error) {
    next(error);
  }
};

export const deleteLeaveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.leaveRequest.delete({
      where: { id: Number(id) },
    });
    sendResponse(res, 200, 'Leave request deleted successfully');
  } catch (error) {
    next(error);
  }
};
