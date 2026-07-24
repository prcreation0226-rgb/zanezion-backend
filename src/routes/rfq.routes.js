import express from 'express';
import * as rfqController from '../controllers/rfq.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createRFQSchema, updateRFQStatusSchema } from '../validators/rfq.validator.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('RFQS', 'READ'), rfqController.getRFQs);
router.get('/:id', checkPermission('RFQS', 'READ'), rfqController.getRFQById);
router.post('/', checkPermission('RFQS', 'CREATE'), validate(createRFQSchema), rfqController.createRFQ);
router.put('/:id/status', checkPermission('RFQS', 'UPDATE'), validate(updateRFQStatusSchema), rfqController.updateRFQStatus);
router.delete('/:id', checkPermission('RFQS', 'DELETE'), rfqController.deleteRFQ);

export default router;
