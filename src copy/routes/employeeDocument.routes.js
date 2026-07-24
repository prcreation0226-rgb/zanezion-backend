import express from 'express';
import * as documentController from '../controllers/employeeDocument.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createDocumentSchema, updateDocumentSchema, verifyDocumentSchema } from '../validators/employeeDocument.validator.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('EMPLOYEE_DOCUMENTS', 'READ'), documentController.getDocuments);
router.get('/:id', checkPermission('EMPLOYEE_DOCUMENTS', 'READ'), documentController.getDocumentById);
router.post('/', checkPermission('EMPLOYEE_DOCUMENTS', 'CREATE'), validate(createDocumentSchema), documentController.createDocument);
router.put('/:id', checkPermission('EMPLOYEE_DOCUMENTS', 'UPDATE'), validate(updateDocumentSchema), documentController.updateDocument);
router.put('/:id/verify', checkPermission('EMPLOYEE_DOCUMENTS', 'VERIFY'), validate(verifyDocumentSchema), documentController.verifyDocument);
router.delete('/:id', checkPermission('EMPLOYEE_DOCUMENTS', 'DELETE'), documentController.deleteDocument);

export default router;
