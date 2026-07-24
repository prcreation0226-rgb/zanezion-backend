import express from 'express';
import * as settingsController from '../controllers/settings.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { updateSettingSchema } from '../validators/settings.validator.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/system', settingsController.getSystemSettings);
router.put('/system', settingsController.updateSystemSettings);

router.get('/user/notifications', settingsController.getUserNotifications);
router.put('/user/notifications', settingsController.updateUserNotifications);

router.get('/', checkPermission('SETTINGS', 'READ'), settingsController.getSettings);
router.put('/:key', checkPermission('SETTINGS', 'UPDATE'), validate(updateSettingSchema), settingsController.updateSetting);

export default router;
