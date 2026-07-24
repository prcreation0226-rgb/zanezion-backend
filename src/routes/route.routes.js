import express from 'express';
import * as routeController from '../controllers/route.controller.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('ROUTES', 'READ'), routeController.getRoutes);
router.post('/', checkPermission('ROUTES', 'CREATE'), routeController.createRoute);
router.put('/:id', checkPermission('ROUTES', 'UPDATE'), routeController.updateRoute);
router.delete('/:id', checkPermission('ROUTES', 'DELETE'), routeController.deleteRoute);

export default router;
