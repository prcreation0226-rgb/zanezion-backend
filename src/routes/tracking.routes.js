import express from 'express';
import * as trackingController from '../controllers/tracking.controller.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('TRACKING', 'READ'), trackingController.getTracking);
router.post('/', checkPermission('TRACKING', 'CREATE'), trackingController.createTracking);
router.put('/:id', checkPermission('TRACKING', 'UPDATE'), trackingController.updateTracking);
router.delete('/:id', checkPermission('TRACKING', 'DELETE'), trackingController.deleteTracking);

export default router;
