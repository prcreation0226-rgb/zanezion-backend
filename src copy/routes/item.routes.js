import express from 'express';
import * as itemController from '../controllers/item.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createItemSchema, updateItemSchema } from '../validators/item.validator.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('ITEMS', 'READ'), itemController.getItems);
router.get('/:id', checkPermission('ITEMS', 'READ'), itemController.getItemById);
router.post('/', checkPermission('ITEMS', 'CREATE'), validate(createItemSchema), itemController.createItem);
router.put('/:id', checkPermission('ITEMS', 'UPDATE'), validate(updateItemSchema), itemController.updateItem);
router.delete('/:id', checkPermission('ITEMS', 'DELETE'), itemController.deleteItem);

export default router;
