import express from 'express';
import * as invoiceController from '../controllers/invoice.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { generateInvoiceSchema } from '../validators/invoice.validator.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('INVOICES', 'READ'), invoiceController.getInvoices);
router.get('/:id', checkPermission('INVOICES', 'READ'), invoiceController.getInvoiceById);
router.post('/', checkPermission('INVOICES', 'MANAGE'), validate(generateInvoiceSchema), invoiceController.generateInvoice);
router.put('/:id', checkPermission('INVOICES', 'MANAGE'), invoiceController.updateInvoice);
router.put('/:id/status', checkPermission('INVOICES', 'APPROVE'), invoiceController.updateInvoiceStatus);
router.delete('/:id', checkPermission('INVOICES', 'DELETE'), invoiceController.deleteInvoice);

export default router;
