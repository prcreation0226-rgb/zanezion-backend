import express from 'express';
import * as conciergeController from '../controllers/concierge.controller.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

// Luxury Items
router.get('/luxury-items', checkPermission('CONCIERGE', 'READ'), conciergeController.getItems);
router.post('/luxury-items', checkPermission('CONCIERGE', 'CREATE'), conciergeController.createItem);
router.put('/luxury-items/:id', checkPermission('CONCIERGE', 'UPDATE'), conciergeController.updateItem);
router.delete('/luxury-items/:id', checkPermission('CONCIERGE', 'DELETE'), conciergeController.deleteItem);

export default router;
