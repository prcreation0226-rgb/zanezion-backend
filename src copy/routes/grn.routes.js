import express from 'express';
import * as grnController from '../controllers/grn.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createGRNSchema, updateGRNStatusSchema } from '../validators/grn.validator.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('GRN', 'READ'), grnController.getGRNs);
router.get('/:id', checkPermission('GRN', 'READ'), grnController.getGRNById);
router.post('/', checkPermission('GRN', 'CREATE'), validate(createGRNSchema), grnController.createGRN);
router.put('/:id/status', checkPermission('GRN', 'APPROVE'), validate(updateGRNStatusSchema), grnController.updateGRNStatus);
router.delete('/:id', checkPermission('GRN', 'DELETE'), grnController.deleteGRN);

export default router;
