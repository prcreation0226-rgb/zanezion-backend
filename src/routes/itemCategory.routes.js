import express from 'express';
import * as categoryController from '../controllers/itemCategory.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createItemCategorySchema, updateItemCategorySchema } from '../validators/itemCategory.validator.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('ITEMS', 'READ'), categoryController.getItemCategories);
router.get('/:id', checkPermission('ITEMS', 'READ'), categoryController.getItemCategoryById);
router.post('/', checkPermission('ITEMS', 'CREATE'), validate(createItemCategorySchema), categoryController.createItemCategory);
router.put('/:id', checkPermission('ITEMS', 'UPDATE'), validate(updateItemCategorySchema), categoryController.updateItemCategory);
router.delete('/:id', checkPermission('ITEMS', 'DELETE'), categoryController.deleteItemCategory);

export default router;
