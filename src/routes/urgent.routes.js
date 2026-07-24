import express from 'express';
import * as urgentController from '../controllers/urgent.controller.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('URGENT', 'READ'), urgentController.getAlerts);
router.post('/', checkPermission('URGENT', 'CREATE'), urgentController.createAlert);
router.put('/:id', checkPermission('URGENT', 'UPDATE'), urgentController.updateAlert);
router.delete('/:id', checkPermission('URGENT', 'DELETE'), urgentController.deleteAlert);

export default router;
