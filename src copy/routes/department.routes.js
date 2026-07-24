import express from 'express';
import * as departmentController from '../controllers/department.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createDepartmentSchema, updateDepartmentSchema } from '../validators/department.validator.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('DEPARTMENTS', 'READ'), departmentController.getDepartments);
router.get('/:id', checkPermission('DEPARTMENTS', 'READ'), departmentController.getDepartmentById);
router.post('/', checkPermission('DEPARTMENTS', 'CREATE'), validate(createDepartmentSchema), departmentController.createDepartment);
router.put('/:id', checkPermission('DEPARTMENTS', 'UPDATE'), validate(updateDepartmentSchema), departmentController.updateDepartment);
router.delete('/:id', checkPermission('DEPARTMENTS', 'DELETE'), departmentController.deleteDepartment);

export default router;
