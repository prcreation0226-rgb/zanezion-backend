import express from 'express';
import * as saasController from '../controllers/saas.controller.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public route for landing page submissions
router.post('/submit', saasController.submitSaaSRequest);

// Protected routes (Super Admin only typically)
router.use(authenticate);

// Approve / Provision a SaaS Request
router.post('/requests/:id/provision', checkPermission('CLIENTS', 'MANAGE'), saasController.provisionSaaSRequest);

// Get SaaS Requests
router.get('/requests', saasController.getSaaSRequests);

export default router;
