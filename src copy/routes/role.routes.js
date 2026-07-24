import express from 'express';
import * as roleController from '../controllers/role.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createRoleSchema, updateRoleSchema, assignPermissionsSchema } from '../validators/role.validator.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

// CRUD
router.get('/menus', checkPermission('ROLES', 'READ'), roleController.getMenus);
router.get('/', checkPermission('ROLES', 'READ'), roleController.getRoles);
router.get('/:id', checkPermission('ROLES', 'READ'), roleController.getRoleById);
router.post('/', checkPermission('ROLES', 'CREATE'), validate(createRoleSchema), roleController.createRole);
router.put('/:id', checkPermission('ROLES', 'UPDATE'), validate(updateRoleSchema), roleController.updateRole);
router.delete('/:id', checkPermission('ROLES', 'DELETE'), roleController.deleteRole);

// Permissions Assignment
router.get('/:id/permissions', checkPermission('ROLES', 'READ'), roleController.getRolePermissions);
router.post('/:id/permissions', checkPermission('ROLES', 'ASSIGN_PERMISSIONS'), roleController.assignPermissions);
router.delete('/:id/permissions', checkPermission('ROLES', 'ASSIGN_PERMISSIONS'), roleController.removePermissions);

export default router;
