import express from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { receivePaymentSchema } from '../validators/payment.validator.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('PAYMENTS', 'READ'), paymentController.getPayments);
router.post('/', checkPermission('PAYMENTS', 'MANAGE'), validate(receivePaymentSchema), paymentController.receivePayment);
router.get('/receipts/:id', checkPermission('RECEIPTS', 'GENERATE'), paymentController.getReceiptById);

export default router;
