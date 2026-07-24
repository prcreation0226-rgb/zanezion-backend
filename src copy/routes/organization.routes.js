import express from 'express';
import * as organizationController from '../controllers/organization.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createOrganizationSchema, updateOrganizationSchema } from '../validators/organization.validator.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

// Enforce Super Admin access
const requireSuperAdmin = checkPermission('ORGANIZATIONS', 'MANAGE');

router.get('/', requireSuperAdmin, organizationController.getOrganizations);
router.get('/:id', requireSuperAdmin, organizationController.getOrganizationById);
router.post('/', requireSuperAdmin, validate(createOrganizationSchema), organizationController.createOrganization);
router.put('/:id', requireSuperAdmin, validate(updateOrganizationSchema), organizationController.updateOrganization);
router.put('/:id/suspend', requireSuperAdmin, organizationController.suspendOrganization);
router.put('/:id/activate', requireSuperAdmin, organizationController.activateOrganization);

export default router;
