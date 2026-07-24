import express from 'express';
import * as vendorController from '../controllers/vendor.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createVendorSchema, updateVendorSchema } from '../validators/vendor.validator.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('VENDORS', 'READ'), vendorController.getVendors);
router.get('/:id', checkPermission('VENDORS', 'READ'), vendorController.getVendorById);
router.post('/', checkPermission('VENDORS', 'CREATE'), validate(createVendorSchema), vendorController.createVendor);
router.put('/:id', checkPermission('VENDORS', 'UPDATE'), validate(updateVendorSchema), vendorController.updateVendor);
router.delete('/:id', checkPermission('VENDORS', 'DELETE'), vendorController.deleteVendor);

export default router;
