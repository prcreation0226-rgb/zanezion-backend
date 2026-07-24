import express from 'express';
import * as financeController from '../controllers/finance.controller.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protect all finance routes
router.use(authenticate);

router.get('/payroll', checkPermission('PAYROLL', 'READ'), financeController.getPayrolls);
router.post('/payroll', checkPermission('PAYROLL', 'CREATE'), financeController.createPayroll);
router.put('/payroll/:id', checkPermission('PAYROLL', 'UPDATE'), financeController.updatePayroll);
router.delete('/payroll/:id', checkPermission('PAYROLL', 'DELETE'), financeController.deletePayroll);

export default router;
