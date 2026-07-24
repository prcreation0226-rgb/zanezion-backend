import express from 'express';
import * as leaveController from '../controllers/leave.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', leaveController.getLeaveRequests);
router.post('/', leaveController.createLeaveRequest);
router.put('/:id', leaveController.updateLeaveRequest);
router.delete('/:id', leaveController.deleteLeaveRequest);

export default router;
