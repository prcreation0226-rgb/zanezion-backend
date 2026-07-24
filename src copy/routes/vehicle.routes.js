import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle
} from '../controllers/vehicle.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getVehicles);
router.post('/', createVehicle);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);

export default router;
