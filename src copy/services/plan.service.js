import * as planRepository from '../repositories/plan.repository.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';

export const createPlan = async (data, performerId) => {
  const plan = await planRepository.createPlan(data);
  
  await logAudit({
    module: 'PLANS',
    action: 'CREATE',
    description: `Created plan ${plan.name}`,
    newValue: plan,
    performedBy: performerId
  });

  return plan;
};

export const getPlans = async (query) => {
  return await planRepository.findAllPlans(query);
};

export const getPlanById = async (id) => {
  const plan = await planRepository.findPlanById(id);
  if (!plan) throw new AppError('Plan not found', 404);
  return plan;
};

export const updatePlan = async (id, data, performerId) => {
  const plan = await planRepository.findPlanById(id);
  if (!plan) throw new AppError('Plan not found', 404);

  const updatedPlan = await planRepository.updatePlan(id, data);

  await logAudit({
    module: 'PLANS',
    action: 'UPDATE',
    description: `Updated plan ${updatedPlan.name}`,
    oldValue: plan,
    newValue: updatedPlan,
    performedBy: performerId
  });

  return updatedPlan;
};

export const activatePlan = async (id, performerId) => {
  return await updatePlan(id, { isActive: true }, performerId);
};

export const deactivatePlan = async (id, performerId) => {
  return await updatePlan(id, { isActive: false }, performerId);
};

export const deletePlan = async (id, performerId) => {
  const plan = await planRepository.findPlanById(id);
  if (!plan) throw new AppError('Plan not found', 404);

  await planRepository.deletePlan(id);

  await logAudit({
    module: 'PLANS',
    action: 'DELETE',
    description: `Deleted plan ${plan.name}`,
    oldValue: plan,
    performedBy: performerId
  });

  return true;
};
