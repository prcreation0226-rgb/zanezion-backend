import express from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createNotificationSchema } from '../validators/notification.validator.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('NOTIFICATIONS', 'READ'), notificationController.getNotifications);
router.get('/unread-count', checkPermission('NOTIFICATIONS', 'READ'), notificationController.getUnreadCount);
router.post('/', checkPermission('NOTIFICATIONS', 'CREATE'), validate(createNotificationSchema), notificationController.createNotification);
router.put('/mark-all-read', checkPermission('NOTIFICATIONS', 'UPDATE'), notificationController.markAllAsRead);
router.put('/:id/read', checkPermission('NOTIFICATIONS', 'UPDATE'), notificationController.markAsRead);
router.delete('/:id', checkPermission('NOTIFICATIONS', 'DELETE'), notificationController.deleteNotification);

export default router;
