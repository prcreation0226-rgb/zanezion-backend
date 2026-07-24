import express from 'express';
import * as securityController from '../controllers/security.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/', securityController.reportSecurityEvent);
router.get('/', securityController.getSecurityEvents);
router.put('/:id/resolve', securityController.resolveSecurityEvent);

export default router;
