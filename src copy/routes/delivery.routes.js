import express from 'express';
import * as deliveryController from '../controllers/delivery.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createDeliverySchema } from '../validators/delivery.validator.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('DELIVERIES', 'READ'), deliveryController.getDeliveries);
router.get('/:id', checkPermission('DELIVERIES', 'READ'), deliveryController.getDeliveryById);
router.post('/', checkPermission('DELIVERIES', 'CREATE'), validate(createDeliverySchema), deliveryController.createDelivery);
router.put('/:id/cancel', checkPermission('DELIVERIES', 'MANAGE'), deliveryController.cancelDelivery);
router.put('/:id', checkPermission('DELIVERIES', 'MANAGE'), deliveryController.updateDelivery);
router.delete('/:id', checkPermission('DELIVERIES', 'MANAGE'), deliveryController.deleteDelivery);

export default router;
