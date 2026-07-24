import express from 'express';
import * as poController from '../controllers/purchaseOrder.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createPurchaseOrderSchema, updatePurchaseOrderStatusSchema, updatePurchaseOrderSchema } from '../validators/purchaseOrder.validator.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('PURCHASE_ORDERS', 'READ'), poController.getPurchaseOrders);
router.get('/:id', checkPermission('PURCHASE_ORDERS', 'READ'), poController.getPurchaseOrderById);
router.post('/', checkPermission('PURCHASE_ORDERS', 'CREATE'), validate(createPurchaseOrderSchema), poController.createPurchaseOrder);
router.put('/:id', checkPermission('PURCHASE_ORDERS', 'UPDATE'), validate(updatePurchaseOrderSchema), poController.updatePurchaseOrder);
router.put('/:id/status', checkPermission('PURCHASE_ORDERS', 'APPROVE'), validate(updatePurchaseOrderStatusSchema), poController.updatePurchaseOrderStatus);
router.put('/:id/receive', checkPermission('PURCHASE_ORDERS', 'UPDATE'), poController.receivePurchaseOrderGoods);
router.put('/:id/approve-receipt', checkPermission('PURCHASE_ORDERS', 'APPROVE'), poController.approvePurchaseOrderReceipt);
router.delete('/:id', checkPermission('PURCHASE_ORDERS', 'DELETE'), poController.deletePurchaseOrder);

export default router;
