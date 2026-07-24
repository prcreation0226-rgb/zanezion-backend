import express from 'express';
import * as subscriptionController from '../controllers/subscription.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createSubscriptionSchema } from '../validators/subscription.validator.js';
import { authenticate, requireSuperAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', requireSuperAdmin, subscriptionController.getSubscriptions);
router.post('/', requireSuperAdmin, validate(createSubscriptionSchema), subscriptionController.createSubscription);
router.put('/:id/upgrade', requireSuperAdmin, subscriptionController.upgradeSubscription);
router.put('/:id/downgrade', requireSuperAdmin, subscriptionController.downgradeSubscription);
router.put('/:id/cancel', requireSuperAdmin, subscriptionController.cancelSubscription);
router.put('/:id/renew', requireSuperAdmin, subscriptionController.renewSubscription);

export default router;
