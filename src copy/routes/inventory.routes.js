import express from 'express';
import * as inventoryController from '../controllers/inventory.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { issueStockSchema, recordLossSchema } from '../validators/inventory.validator.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/issue', checkPermission('STOCK', 'ADJUST'), validate(issueStockSchema), inventoryController.issueStock);
router.post('/loss', checkPermission('STOCK', 'ADJUST'), validate(recordLossSchema), inventoryController.recordLoss);
router.get('/loss', checkPermission('STOCK', 'READ'), inventoryController.getLossAssessments);
router.get('/', checkPermission('ITEMS', 'READ'), inventoryController.getInventory);

export default router;
