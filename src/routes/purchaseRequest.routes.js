import express from 'express';
import * as prController from '../controllers/purchaseRequest.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createPurchaseRequestSchema, updatePurchaseRequestSchema, changeStatusSchema } from '../validators/purchaseRequest.validator.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('PURCHASE_REQUESTS', 'READ'), prController.getPurchaseRequests);
router.get('/:id', checkPermission('PURCHASE_REQUESTS', 'READ'), prController.getPurchaseRequestById);
router.post('/', checkPermission('PURCHASE_REQUESTS', 'CREATE'), validate(createPurchaseRequestSchema), prController.createPurchaseRequest);
router.put('/:id', checkPermission('PURCHASE_REQUESTS', 'UPDATE'), validate(updatePurchaseRequestSchema), prController.updatePurchaseRequest);
router.put('/:id/status', checkPermission('PURCHASE_REQUESTS', 'APPROVE'), validate(changeStatusSchema), prController.updatePurchaseRequestStatus);
router.delete('/:id', checkPermission('PURCHASE_REQUESTS', 'DELETE'), prController.deletePurchaseRequest);

export default router;
