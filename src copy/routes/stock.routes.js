import express from 'express';
import * as stockController from '../controllers/stock.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { adjustStockSchema, transferStockSchema } from '../validators/stock.validator.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('STOCK', 'READ'), stockController.getStock);
router.get('/movements', checkPermission('STOCK', 'READ'), stockController.getMovements);
router.post('/adjust', checkPermission('STOCK', 'ADJUST'), validate(adjustStockSchema), stockController.adjustStock);
router.post('/transfer', checkPermission('STOCK', 'TRANSFER'), validate(transferStockSchema), stockController.transferStock);

export default router;
