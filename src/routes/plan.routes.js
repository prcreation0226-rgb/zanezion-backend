import express from 'express';
import * as planController from '../controllers/plan.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createPlanSchema, updatePlanSchema } from '../validators/plan.validator.js';
import { authenticate, checkPermission, requireSuperAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/public', planController.getPublicPlans);

router.use(authenticate);

router.get('/', checkPermission('PLANS', 'READ'), planController.getPlans);
router.get('/:id', checkPermission('PLANS', 'READ'), planController.getPlanById);
router.post('/', requireSuperAdmin, validate(createPlanSchema), planController.createPlan);
router.put('/:id', requireSuperAdmin, validate(updatePlanSchema), planController.updatePlan);
router.put('/:id/activate', requireSuperAdmin, planController.activatePlan);
router.put('/:id/deactivate', requireSuperAdmin, planController.deactivatePlan);
router.delete('/:id', requireSuperAdmin, planController.deletePlan);

export default router;
