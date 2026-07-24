import express from 'express';
import * as warehouseController from '../controllers/warehouse.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createWarehouseSchema, updateWarehouseSchema } from '../validators/warehouse.validator.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('WAREHOUSES', 'READ'), warehouseController.getWarehouses);
router.get('/:id', checkPermission('WAREHOUSES', 'READ'), warehouseController.getWarehouseById);
router.post('/', checkPermission('WAREHOUSES', 'CREATE'), validate(createWarehouseSchema), warehouseController.createWarehouse);
router.put('/:id', checkPermission('WAREHOUSES', 'UPDATE'), validate(updateWarehouseSchema), warehouseController.updateWarehouse);
router.delete('/:id', checkPermission('WAREHOUSES', 'DELETE'), warehouseController.deleteWarehouse);

export default router;
