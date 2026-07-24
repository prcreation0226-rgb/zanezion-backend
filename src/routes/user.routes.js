import express from 'express';
import * as userController from '../controllers/user.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createUserSchema, updateUserSchema } from '../validators/user.validator.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';
import { enforceSubscriptionLimits } from '../middlewares/subscription.middleware.js';

import { upload } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.use(authenticate);

// Must have read users permission
router.get('/', checkPermission('USERS', 'READ'), userController.getUsers);
// Customers route (must be before /:id)
router.get('/customers', checkPermission('USERS', 'READ'), userController.getCustomers);

router.get('/:id', checkPermission('USERS', 'READ'), userController.getUserById);

// Must have create users permission
router.post('/', checkPermission('USERS', 'CREATE'), enforceSubscriptionLimits, validate(createUserSchema), userController.createUser);
router.put('/:id', checkPermission('USERS', 'UPDATE'), validate(updateUserSchema), userController.updateUser);
router.post('/:id/documents', checkPermission('USERS', 'UPDATE'), upload.single('file'), userController.uploadDocument);
router.delete('/:id', checkPermission('USERS', 'DELETE'), userController.deleteUser);

export default router;
