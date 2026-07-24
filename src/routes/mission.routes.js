import express from 'express';
import * as missionController from '../controllers/mission.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createMissionSchema, submitPODSchema } from '../validators/mission.validator.js';
import { authenticate, checkPermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('MISSIONS', 'READ'), missionController.getMissions);
router.get('/:id', checkPermission('MISSIONS', 'READ'), missionController.getMissionById);
router.post('/', checkPermission('MISSIONS', 'MANAGE'), validate(createMissionSchema), missionController.createMission);
router.post('/convert-project/:projectId', checkPermission('MISSIONS', 'MANAGE'), missionController.convertProjectToMission);
router.post('/convert/:orderId', checkPermission('MISSIONS', 'MANAGE'), missionController.convertOrderToMission);
router.post('/:id/start', checkPermission('MISSIONS', 'MANAGE'), missionController.startMission);
router.post('/:id/pod', checkPermission('MISSIONS', 'COMPLETE'), validate(submitPODSchema), missionController.submitPOD);
router.put('/:id/assign', checkPermission('MISSIONS', 'MANAGE'), missionController.assignMission);
router.put('/:id/status', checkPermission('MISSIONS', 'MANAGE'), missionController.updateMissionStatus);
router.delete('/:id', checkPermission('MISSIONS', 'MANAGE'), missionController.deleteMission);

export default router;
