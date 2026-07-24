import express from 'express';
import * as permissionController from '../controllers/permission.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createPermissionSchema, updatePermissionSchema } from '../validators/permission.validator.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

// CRUD
router.get('/', checkPermission('PERMISSIONS', 'READ'), permissionController.getPermissions);
router.get('/:id', checkPermission('PERMISSIONS', 'READ'), permissionController.getPermissionById);
router.post('/', checkPermission('PERMISSIONS', 'CREATE'), validate(createPermissionSchema), permissionController.createPermission);
router.put('/:id', checkPermission('PERMISSIONS', 'UPDATE'), validate(updatePermissionSchema), permissionController.updatePermission);
router.delete('/:id', checkPermission('PERMISSIONS', 'DELETE'), permissionController.deletePermission);

export default router;
