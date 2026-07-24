import express from 'express';
import * as clientController from '../controllers/client.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createClientSchema, updateClientSchema, createClientContactSchema } from '../validators/client.validator.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

// Client Routes
router.get('/', checkPermission('CLIENTS', 'READ'), clientController.getClients);
router.get('/:id', checkPermission('CLIENTS', 'READ'), clientController.getClientById);
router.post('/', checkPermission('CLIENTS', 'CREATE'), validate(createClientSchema), clientController.createClient);
router.put('/:id', checkPermission('CLIENTS', 'UPDATE'), validate(updateClientSchema), clientController.updateClient);
router.delete('/:id', checkPermission('CLIENTS', 'DELETE'), clientController.deleteClient);

// Client Contact Routes
router.post('/:id/contacts', checkPermission('CLIENTS', 'UPDATE'), validate(createClientContactSchema), clientController.addClientContact);
router.delete('/:id/contacts/:contactId', checkPermission('CLIENTS', 'UPDATE'), clientController.removeClientContact);

export default router;
