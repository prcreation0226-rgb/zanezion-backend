import prisma from '../config/db.js';

const generateMissionNumber = async (tenantId) => {
  const count = await prisma.mission.count({ where: { tenantId } });
  return `MSN-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
};

export const createMission = async (data, tenantId) => {
  return await prisma.$transaction(async (tx) => {
    const missionNumber = await generateMissionNumber(tenantId);
    
    // Create Mission
    const mission = await tx.mission.create({
      data: {
        ...data,
        missionNumber,
        tenantId
      },
      include: { assignee: true, delivery: true }
    });

    // Update Delivery Status ONLY if deliveryId exists
    if (data.deliveryId) {
      await tx.delivery.update({
        where: { id: data.deliveryId },
        data: { status: 'assigned', assignedTo: data.assignedEmployeeId }
      });
    }

    return mission;
  });
};

export const findMissionById = async (id) => {
  const isNumeric = !isNaN(id) && !isNaN(parseInt(id, 10));
  return await prisma.mission.findFirst({
    where: isNumeric ? { id: parseInt(id, 10) } : { missionNumber: id },
    include: {
      delivery: { include: { items: true, client: true } },
      assignee: { select: { firstName: true, lastName: true, vehiclePlate: true, vehicleModel: true, vehicleType: true } }
    }
  });
};

export const findAllMissions = async (tenantId, query) => {
  const { page = 1, limit = 10, search = '', status, assignedEmployeeId } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(tenantId !== null && { tenantId }),
    ...(search && { missionNumber: { contains: search } }),
    ...(status && { status }),
    ...(assignedEmployeeId && { assignedEmployeeId: Number(assignedEmployeeId) })
  };

  const [missions, total] = await Promise.all([
    prisma.mission.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        delivery: { select: { deliveryNumber: true, pickupLocation: true, dropLocation: true, client: { select: { companyName: true, address: true, city: true, country: true } } } },
          assignee: { select: { firstName: true, lastName: true, vehiclePlate: true, vehicleModel: true, vehicleType: true } }
      }
    }),
    prisma.mission.count({ where })
  ]);

  return { missions, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

export const updateMissionStatus = async (tx, id, status, extraData = {}) => {
  return await tx.mission.update({
    where: { id },
    data: { status, ...extraData }
  });
};

export const createPOD = async (tx, deliveryId, tenantId, podData) => {
  return await tx.proofOfDelivery.create({
    data: {
      ...podData,
      deliveryId,
      tenantId
    }
  });
};

export const deleteMission = async (id) => {
  const isNumeric = !isNaN(id) && !isNaN(parseInt(id, 10));
  const mission = await prisma.mission.findFirst({
    where: isNumeric ? { id: parseInt(id, 10) } : { missionNumber: id },
  });
  if (mission) {
    return await prisma.mission.delete({ where: { id: mission.id } });
  }
  return null;
};
