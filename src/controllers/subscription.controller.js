import * as subscriptionService from '../services/subscription.service.js';
import { sendResponse } from '../utils/response.js';

export const createSubscription = async (req, res, next) => {
  try {
    const sub = await subscriptionService.createSubscription(req.body, req.user.id);
    sendResponse(res, 201, 'Subscription created successfully', sub);
  } catch (error) {
    next(error);
  }
};

export const getSubscriptions = async (req, res, next) => {
  try {
    const subs = await subscriptionService.getSubscriptions(req.query);
    sendResponse(res, 200, 'Subscriptions fetched successfully', subs);
  } catch (error) {
    next(error);
  }
};

export const upgradeSubscription = async (req, res, next) => {
  try {
    const sub = await subscriptionService.upgradeOrDowngradeSubscription(Number(req.params.id), req.body.planId, 'Upgrade', req.user.id);
    sendResponse(res, 200, 'Subscription upgraded successfully', sub);
  } catch (error) {
    next(error);
  }
};

export const downgradeSubscription = async (req, res, next) => {
  try {
    const sub = await subscriptionService.upgradeOrDowngradeSubscription(Number(req.params.id), req.body.planId, 'Downgrade', req.user.id);
    sendResponse(res, 200, 'Subscription downgraded successfully', sub);
  } catch (error) {
    next(error);
  }
};

export const cancelSubscription = async (req, res, next) => {
  try {
    const sub = await subscriptionService.cancelSubscription(Number(req.params.id), req.user.id);
    sendResponse(res, 200, 'Subscription cancelled successfully', sub);
  } catch (error) {
    next(error);
  }
};

export const renewSubscription = async (req, res, next) => {
  try {
    const sub = await subscriptionService.renewSubscription(Number(req.params.id), req.user.id);
    sendResponse(res, 200, 'Subscription renewed successfully', sub);
  } catch (error) {
    next(error);
  }
};
