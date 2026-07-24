import * as vehicleRepo from '../repositories/vehicle.repository.js';
import AppError from '../utils/AppError.js';

export const createVehicle = async (data, tenantId) => {
  return await vehicleRepo.createVehicle({ ...data, tenantId: tenantId ? Number(tenantId) : null });
};

export const getVehicles = async (tenantId) => {
  return await vehicleRepo.findAllVehicles(tenantId ? Number(tenantId) : null);
};

export const getVehicleById = async (id) => {
  const vehicle = await vehicleRepo.findVehicleById(Number(id));
  if (!vehicle) throw new AppError('Vehicle not found', 404);
  return vehicle;
};

export const updateVehicle = async (id, data) => {
  await getVehicleById(id);
  return await vehicleRepo.updateVehicle(Number(id), data);
};

export const deleteVehicle = async (id) => {
  await getVehicleById(id);
  await vehicleRepo.deleteVehicle(Number(id));
  return true;
};
