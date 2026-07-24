import express from 'express';
import { getDashboardStats, getDashboardLogs } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/logs', getDashboardLogs);

export default router;
