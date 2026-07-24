import prisma from '../config/db.js';

export const createVehicle = async (data) => {
  return await prisma.vehicle.create({ data });
};

export const findAllVehicles = async (tenantId) => {
  return await prisma.vehicle.findMany({
    where: tenantId ? { tenantId } : {},
    orderBy: { createdAt: 'desc' }
  });
};

export const findVehicleById = async (id) => {
  return await prisma.vehicle.findUnique({ where: { id } });
};

export const updateVehicle = async (id, data) => {
  return await prisma.vehicle.update({ where: { id }, data });
};

export const deleteVehicle = async (id) => {
  return await prisma.vehicle.delete({ where: { id } });
};
