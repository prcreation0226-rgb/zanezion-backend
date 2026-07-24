import express from 'express';
import * as tenantController from '../controllers/tenant.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createTenantSchema, updateTenantSchema } from '../validators/tenant.validator.js';
import { authenticate, requireSuperAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', requireSuperAdmin, tenantController.getTenants);
router.get('/:id', requireSuperAdmin, tenantController.getTenantById);
router.post('/', requireSuperAdmin, validate(createTenantSchema), tenantController.createTenant);
router.put('/:id', requireSuperAdmin, validate(updateTenantSchema), tenantController.updateTenant);
router.put('/:id/suspend', requireSuperAdmin, tenantController.suspendTenant);
router.put('/:id/activate', requireSuperAdmin, tenantController.activateTenant);
router.delete('/:id', requireSuperAdmin, tenantController.deleteTenant);

export default router;
