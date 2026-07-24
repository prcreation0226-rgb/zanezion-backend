import * as vehicleService from '../services/vehicle.service.js';

export const getVehicles = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    const vehicles = await vehicleService.getVehicles(tenantId);
    res.json({ success: true, data: vehicles });
  } catch (err) {
    next(err);
  }
};

export const createVehicle = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    const vehicle = await vehicleService.createVehicle(req.body, tenantId);
    res.status(201).json({ success: true, data: vehicle });
  } catch (err) {
    next(err);
  }
};

export const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.updateVehicle(req.params.id, req.body);
    res.json({ success: true, data: vehicle });
  } catch (err) {
    next(err);
  }
};

export const deleteVehicle = async (req, res, next) => {
  try {
    await vehicleService.deleteVehicle(req.params.id);
    res.json({ success: true, message: 'Vehicle deleted' });
  } catch (err) {
    next(err);
  }
};
