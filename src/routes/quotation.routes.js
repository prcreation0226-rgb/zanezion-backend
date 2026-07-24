import express from 'express';
import * as quotationController from '../controllers/quotation.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createQuotationSchema, updateQuotationStatusSchema } from '../validators/quotation.validator.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('QUOTATIONS', 'READ'), quotationController.getQuotations);
router.get('/:id', checkPermission('QUOTATIONS', 'READ'), quotationController.getQuotationById);
router.post('/', checkPermission('QUOTATIONS', 'CREATE'), validate(createQuotationSchema), quotationController.createQuotation);
router.put('/:id/status', checkPermission('QUOTATIONS', 'UPDATE'), validate(updateQuotationStatusSchema), quotationController.updateQuotationStatus);
router.delete('/:id', checkPermission('QUOTATIONS', 'DELETE'), quotationController.deleteQuotation);

export default router;
