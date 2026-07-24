import express from 'express';
import * as designationController from '../controllers/designation.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createDesignationSchema, updateDesignationSchema } from '../validators/designation.validator.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('DESIGNATIONS', 'READ'), designationController.getDesignations);
router.get('/:id', checkPermission('DESIGNATIONS', 'READ'), designationController.getDesignationById);
router.post('/', checkPermission('DESIGNATIONS', 'CREATE'), validate(createDesignationSchema), designationController.createDesignation);
router.put('/:id', checkPermission('DESIGNATIONS', 'UPDATE'), validate(updateDesignationSchema), designationController.updateDesignation);
router.delete('/:id', checkPermission('DESIGNATIONS', 'DELETE'), designationController.deleteDesignation);

export default router;
