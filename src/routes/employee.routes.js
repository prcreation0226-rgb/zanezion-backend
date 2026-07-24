import express from 'express';
import * as employeeController from '../controllers/employee.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createEmployeeSchema, updateEmployeeSchema } from '../validators/employee.validator.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';
import { enforceSubscriptionLimits } from '../middlewares/subscription.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('EMPLOYEES', 'READ'), employeeController.getEmployees);
router.get('/:id', checkPermission('EMPLOYEES', 'READ'), employeeController.getEmployeeById);
router.post('/', checkPermission('EMPLOYEES', 'CREATE'), enforceSubscriptionLimits, validate(createEmployeeSchema), employeeController.createEmployee);
router.put('/:id', checkPermission('EMPLOYEES', 'UPDATE'), validate(updateEmployeeSchema), employeeController.updateEmployee);
router.delete('/:id', checkPermission('EMPLOYEES', 'DELETE'), employeeController.deleteEmployee);

export default router;
