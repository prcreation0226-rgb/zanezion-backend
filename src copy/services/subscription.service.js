import * as subscriptionRepository from '../repositories/subscription.repository.js';
import * as planRepository from '../repositories/plan.repository.js';
import prisma from '../config/db.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';

export const createSubscription = async (data, performerId) => {
  const plan = await planRepository.findPlanById(data.planId);
  if (!plan) throw new AppError('Plan not found', 404);

  // Check if tenant already has an active subscription
  const activeSub = await subscriptionRepository.findActiveSubscriptionByTenantId(data.tenantId);
  if (activeSub) {
    throw new AppError('Tenant already has an active subscription', 400);
  }

  const startDate = new Date();
  const endDate = new Date();
  
  if (plan.billingCycle === 'MONTHLY') {
    endDate.setMonth(endDate.getMonth() + 1);
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  const subscription = await subscriptionRepository.createSubscription({
    tenantId: data.tenantId,
    planId: data.planId,
    startDate,
    endDate,
    status: 'ACTIVE',
    paymentStatus: 'PAID'
  });

  // Update Tenant's active subscription ID
  await prisma.tenant.update({
    where: { id: data.tenantId },
    data: { subscriptionId: subscription.id }
  });

  await logAudit({
    module: 'SUBSCRIPTIONS',
    action: 'CREATE',
    description: `Assigned plan ${plan.name} to tenant ${data.tenantId}`,
    newValue: subscription,
    performedBy: performerId
  });

  // Trigger Notification
  await prisma.notification.create({
    data: {
      title: 'New Subscription',
      message: `A new subscription for ${plan.name} has been activated.`,
      type: 'SUBSCRIPTION',
      userId: performerId
    }
  });

  return subscription;
};

export const getSubscriptions = async (query) => {
  return await subscriptionRepository.findAllSubscriptions(query);
};

export const upgradeOrDowngradeSubscription = async (id, newPlanId, actionType, performerId) => {
  const subscription = await subscriptionRepository.findSubscriptionById(id);
  if (!subscription) throw new AppError('Subscription not found', 404);

  const newPlan = await planRepository.findPlanById(newPlanId);
  if (!newPlan) throw new AppError('New plan not found', 404);

  // Soft cancel current subscription
  await subscriptionRepository.updateSubscription(id, { status: 'CANCELLED', autoRenew: false });

  // Create new subscription
  const startDate = new Date();
  const endDate = new Date();
  
  if (newPlan.billingCycle === 'MONTHLY') {
    endDate.setMonth(endDate.getMonth() + 1);
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  const newSubscription = await subscriptionRepository.createSubscription({
    tenantId: subscription.tenantId,
    planId: newPlanId,
    startDate,
    endDate,
    status: 'ACTIVE',
    paymentStatus: 'PAID'
  });

  // Update Tenant's active subscription ID
  await prisma.tenant.update({
    where: { id: subscription.tenantId },
    data: { subscriptionId: newSubscription.id }
  });

  await logAudit({
    module: 'SUBSCRIPTIONS',
    action: actionType.toUpperCase(),
    description: `${actionType} from ${subscription.plan.name} to ${newPlan.name}`,
    oldValue: subscription,
    newValue: newSubscription,
    performedBy: performerId
  });

  await prisma.notification.create({
    data: {
      title: `Plan ${actionType}`,
      message: `Plan changed to ${newPlan.name}`,
      type: 'SUBSCRIPTION',
      userId: performerId
    }
  });

  return newSubscription;
};

export const cancelSubscription = async (id, performerId) => {
  const subscription = await subscriptionRepository.findSubscriptionById(id);
  if (!subscription) throw new AppError('Subscription not found', 404);

  const updated = await subscriptionRepository.updateSubscription(id, { status: 'CANCELLED', autoRenew: false });

  // Remove active sub link from tenant
  await prisma.tenant.update({
    where: { id: subscription.tenantId },
    data: { subscriptionId: null }
  });

  await logAudit({
    module: 'SUBSCRIPTIONS',
    action: 'CANCEL',
    description: `Cancelled subscription ${id}`,
    oldValue: subscription,
    newValue: updated,
    performedBy: performerId
  });

  return updated;
};

export const renewSubscription = async (id, performerId) => {
  const subscription = await subscriptionRepository.findSubscriptionById(id);
  if (!subscription) throw new AppError('Subscription not found', 404);

  const plan = await planRepository.findPlanById(subscription.planId);

  const endDate = new Date(subscription.endDate);
  if (plan.billingCycle === 'MONTHLY') {
    endDate.setMonth(endDate.getMonth() + 1);
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  const updated = await subscriptionRepository.updateSubscription(id, { endDate, status: 'ACTIVE' });

  await logAudit({
    module: 'SUBSCRIPTIONS',
    action: 'RENEW',
    description: `Renewed subscription ${id}`,
    oldValue: subscription,
    newValue: updated,
    performedBy: performerId
  });

  return updated;
};
