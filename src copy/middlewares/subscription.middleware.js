import prisma from '../config/db.js';
import { sendResponse } from '../utils/response.js';

export const enforceSubscriptionLimits = async (req, res, next) => {
  try {
    const { tenantId, role } = req.user;

    // Super Admins, Internal Admins, and HQ (tenantId 1) bypass subscription checks
    if ((role && (role.name === 'SUPER_ADMIN' || role.name === 'ADMIN')) || tenantId === 1) {
      return next();
    }

    if (!tenantId) {
      return sendResponse(res, 400, 'Tenant ID is required for this action');
    }

    // Fetch tenant and active subscription
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        activeSubscription: {
          include: { plan: true }
        }
      }
    });

    if (!tenant) {
      return sendResponse(res, 404, 'Tenant not found');
    }

    if (tenant.status !== 'active') {
      return sendResponse(res, 403, 'Tenant account is suspended');
    }

    const subscription = tenant.activeSubscription;

    if (!subscription || subscription.status !== 'ACTIVE') {
      return sendResponse(res, 403, 'No active subscription found. Please upgrade to create users.');
    }

    if (new Date() > new Date(subscription.endDate)) {
      return sendResponse(res, 403, 'Subscription has expired. Please renew your plan.');
    }

    const { maxUsers } = subscription.plan;

    // Check user limit
    const currentUserCount = await prisma.user.count({
      where: { tenantId, deletedAt: null }
    });

    if (currentUserCount >= maxUsers) {
      return sendResponse(res, 403, `Plan limit exceeded. Maximum allowed users: ${maxUsers}`);
    }

    next();
  } catch (error) {
    console.error('Subscription enforcement error:', error);
    return sendResponse(res, 500, 'Error enforcing subscription limits');
  }
};
