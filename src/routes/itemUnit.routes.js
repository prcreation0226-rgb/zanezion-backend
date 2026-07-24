import express from 'express';
import * as unitController from '../controllers/itemUnit.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createItemUnitSchema, updateItemUnitSchema } from '../validators/itemUnit.validator.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('ITEMS', 'READ'), unitController.getItemUnits);
router.get('/:id', checkPermission('ITEMS', 'READ'), unitController.getItemUnitById);
router.post('/', checkPermission('ITEMS', 'CREATE'), validate(createItemUnitSchema), unitController.createItemUnit);
router.put('/:id', checkPermission('ITEMS', 'UPDATE'), validate(updateItemUnitSchema), unitController.updateItemUnit);
router.delete('/:id', checkPermission('ITEMS', 'DELETE'), unitController.deleteItemUnit);

export default router;
