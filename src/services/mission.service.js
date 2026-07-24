import * as missionRepo from '../repositories/mission.repository.js';
import * as deliveryRepo from '../repositories/delivery.repository.js';
import * as employeeRepo from '../repositories/employee.repository.js';
import prisma from '../config/db.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';

export const createMission = async (data, performerId, tenantId) => {
  if (data.deliveryId) {
    const delivery = await deliveryRepo.findDeliveryById(data.deliveryId);
    if (!delivery || (tenantId !== null && delivery.tenantId !== tenantId)) {
      throw new AppError('Delivery not found', 404);
    }

    // Check if an active mission already exists for this delivery
    const activeMission = await prisma.mission.findFirst({
      where: { deliveryId: delivery.id, status: { notIn: ['completed', 'cancelled'] } }
    });
  }

  let employee = null;
  if (data.assignedEmployeeId) {
    employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { id: Number(data.assignedEmployeeId) },
          { userId: Number(data.assignedEmployeeId) }
        ]
      }
    });

    if (!employee) {
      const user = await prisma.user.findUnique({ where: { id: Number(data.assignedEmployeeId) } });
      if (user && (tenantId === null || user.tenantId === tenantId || user.tenantId === null)) {
        const effectiveTenantId = user.tenantId || tenantId || 1;
        let defaultDept = await prisma.department.findFirst({ where: { tenantId: effectiveTenantId, name: 'Operations' } });
        if (!defaultDept) defaultDept = await prisma.department.create({ data: { tenantId: effectiveTenantId, name: 'Operations', code: 'OPS-01' } });

        let defaultDesig = await prisma.designation.findFirst({ where: { tenantId: effectiveTenantId, name: 'Field Staff' } });
        if (!defaultDesig) defaultDesig = await prisma.designation.create({ data: { tenantId: effectiveTenantId, departmentId: defaultDept.id, name: 'Field Staff' } });

        employee = await prisma.employee.create({
          data: {
            userId: user.id,
            tenantId: effectiveTenantId,
            firstName: user.name?.split(' ')[0] || 'Unknown',
            lastName: user.name?.split(' ').slice(1).join(' ') || 'User',
            employeeCode: `EMP-${user.id}-${Date.now().toString().slice(-4)}`,
            departmentId: defaultDept.id,
            designationId: defaultDesig.id,
            joiningDate: new Date(),
            status: 'active'
          }
        });
      }
    }
  }

  if (!employee) {
    throw new AppError('Employee not found or unauthorized', 404);
  }

  data.assignedEmployeeId = employee.id;

  // If a mission already exists, just update its assigned employee and we're done
  if (data.deliveryId) {
    const activeMission = await prisma.mission.findFirst({
      where: { deliveryId: data.deliveryId, status: { notIn: ['completed', 'cancelled'] } }
    });
    if (activeMission) {
      await prisma.mission.update({
        where: { id: activeMission.id },
        data: { assignedEmployeeId: employee.id }
      });
      await prisma.delivery.update({
        where: { id: data.deliveryId },
        data: { assignedTo: employee.id }
      });
      return await missionRepo.findMissionById(activeMission.id);
    }
  }


  const newMission = await missionRepo.createMission(data, tenantId);

  await logAudit({
    module: 'MISSIONS',
    action: 'CREATE',
    description: `Assigned Mission ${newMission.missionNumber} to ${employee.firstName} ${employee.lastName}`,
    newValue: newMission,
    performedBy: performerId
  });

  return newMission;
};

export const startMission = async (id, tenantId, performerId) => {
  const mission = await missionRepo.findMissionById(id);
  if (!mission || (tenantId !== null && mission.tenantId !== tenantId)) throw new AppError('Mission not found', 404);

  if (mission.status !== 'assigned') throw new AppError(`Cannot start a mission in ${mission.status} status`, 400);

  const delivery = mission.delivery;

  await prisma.$transaction(async (tx) => {
    // 1. Update Mission
    await missionRepo.updateMissionStatus(tx, mission.id, 'in_progress', { startDate: new Date() });

    // 2. Update Delivery and Inventory ONLY if this is a Delivery Mission
    if (delivery) {
      await deliveryRepo.updateDeliveryStatus(tx, delivery.id, 'dispatched', { dispatchDate: new Date() });

      // 3. Dispatch Engine: Deduct Inventory Stock (Quantity & Reserved)
      for (const item of delivery.items) {
        const stock = await tx.inventoryStock.findUnique({
          where: { warehouseId_itemId: { warehouseId: delivery.warehouseId, itemId: item.itemId } }
        });

        if (!stock || stock.quantity < item.quantity) {
          console.warn(`[Dispatch Engine] Bypassed inventory check: Insufficient physical stock for Item ${item.itemId}.`);
          continue;
        }

        await tx.inventoryStock.update({
          where: { id: stock.id },
          data: {
            quantity: { decrement: item.quantity },
            reservedQuantity: stock.reservedQuantity >= item.quantity ? { decrement: item.quantity } : undefined
          }
        });

        // Log Stock Movement
        await tx.stockMovement.create({
          data: {
            tenantId: delivery.tenantId,
            warehouseId: delivery.warehouseId,
            itemId: item.itemId,
            movementType: 'OUT',
            quantity: item.quantity,
            referenceType: 'DELIVERY',
            remarks: `Dispatched via Mission ${mission.missionNumber} (Delivery ID: ${delivery.id})`
          }
        });
      }
    } // End if delivery
  }, { timeout: 60000 });

  await logAudit({
    module: 'MISSIONS',
    action: 'START',
    description: `Mission ${mission.missionNumber} started. ${delivery ? `Delivery ${delivery.deliveryNumber} dispatched.` : ''}`,
    performedBy: performerId
  });

  return true;
};

export const submitPOD = async (id, podData, tenantId, performerId) => {
  // First, check if it's an actual Mission ID
  let mission = await missionRepo.findMissionById(id);
  if (mission && ['completed', 'cancelled'].includes(mission.status)) {
    mission = null;
  }

  // If not, see if the ID corresponds to a Delivery ID with an active mission
  if (!mission) {
    mission = await prisma.mission.findFirst({
      where: { deliveryId: Number(id), status: { notIn: ['completed', 'cancelled'] } }
    });
  }

  if (!mission) {
    // If STILL no active mission, it means this delivery was never "dispatched" officially through a mission.
    // We can just complete the delivery directly!
    const delivery = await deliveryRepo.findDeliveryById(Number(id));
    if (!delivery) throw new AppError('Delivery/Mission not found', 404);

    if (['delivered', 'cancelled'].includes(delivery.status)) {
      throw new AppError(`Cannot complete a delivery in ${delivery.status} status`, 400);
    }

    await prisma.$transaction(async (tx) => {
      const routeDistance = delivery.routeDistance || 0;
      // Frontend saves Rate per KM as staffPayRate, and total payout as deliveryFee.
      const tripEarning = delivery.deliveryFee || (routeDistance * (delivery.staffPayRate || 0));

      await deliveryRepo.updateDeliveryStatus(tx, Number(id), 'delivered', {
        deliveryDate: new Date()
      });
      await missionRepo.createPOD(tx, Number(id), tenantId || delivery.tenantId, podData);

      // Accumulate Staff Earning to Payroll
      if (delivery.assignedTo) {
        const employee = await tx.employee.findUnique({ where: { id: delivery.assignedTo } });
        if (employee && employee.userId) {
          const payroll = await tx.payroll.findFirst({ where: { userId: employee.userId, status: 'Pending' } });
          if (payroll) {
            await tx.payroll.update({
              where: { id: payroll.id },
              data: { bonus: { increment: tripEarning }, netAmount: { increment: tripEarning } }
            });
          } else {
            await tx.payroll.create({
              data: {
                tenantId: employee.tenantId,
                userId: employee.userId,
                bonus: tripEarning,
                netAmount: tripEarning,
                status: 'Pending'
              }
            });
          }
        }
      }
    }, { timeout: 60000 });

    await logAudit({
      module: 'DELIVERIES',
      action: 'COMPLETE',
      description: `Delivery ${delivery.deliveryNumber} completed via direct POD.`,
      performedBy: performerId
    });
    return true;
  }

  if (!mission || (tenantId !== null && mission.tenantId !== tenantId)) throw new AppError('Mission not found', 404);

  if (mission.status !== 'in_progress' && mission.status !== 'assigned' && mission.status !== 'en_route') throw new AppError(`Cannot complete a mission in ${mission.status} status`, 400);

  await prisma.$transaction(async (tx) => {
    // 1. Create POD if delivery exists
    if (mission.deliveryId && podData && Object.keys(podData).length > 0) {
      await missionRepo.createPOD(tx, mission.deliveryId, mission.tenantId, podData);
    }

    // 2. Update Mission
    await missionRepo.updateMissionStatus(tx, mission.id, 'completed', { endDate: new Date() });

    // 3. Update Delivery & Calculate Earnings
    if (mission.deliveryId) {
      const delivery = await tx.delivery.findUnique({ where: { id: mission.deliveryId } });
      const routeDistance = delivery?.routeDistance || 0;
      // Frontend saves Rate per KM as staffPayRate, and total payout as deliveryFee.
      const tripEarning = delivery?.deliveryFee || (routeDistance * (delivery?.staffPayRate || 0));

      await deliveryRepo.updateDeliveryStatus(tx, mission.deliveryId, 'delivered', {
        deliveryDate: new Date()
      });

      // Accumulate Staff Earning to Payroll
      if (delivery && delivery.assignedTo) {
        const employee = await tx.employee.findUnique({ where: { id: delivery.assignedTo } });
        if (employee && employee.userId) {
          const payroll = await tx.payroll.findFirst({ where: { userId: employee.userId, status: 'Pending' } });
          if (payroll) {
            await tx.payroll.update({
              where: { id: payroll.id },
              data: { bonus: { increment: tripEarning }, netAmount: { increment: tripEarning } }
            });
          } else {
            await tx.payroll.create({
              data: {
                tenantId: employee.tenantId,
                userId: employee.userId,
                bonus: tripEarning,
                netAmount: tripEarning,
                status: 'Pending'
              }
            });
          }
        }
      }
    }
  }, { timeout: 60000 });

  await logAudit({
    module: 'MISSIONS',
    action: 'COMPLETE',
    description: `Mission ${mission.missionNumber} completed. POD Submitted.`,
    performedBy: performerId
  });

  return true;
};

export const getMissions = async (tenantId, query) => {
  return await missionRepo.findAllMissions(tenantId, query);
};

export const getMissionById = async (id, tenantId) => {
  const mission = await missionRepo.findMissionById(id);
  if (!mission || (tenantId !== null && mission.tenantId !== tenantId)) throw new AppError('Mission not found', 404);
  return mission;
};

export const convertProjectToMission = async (projectId, missionData, tenantId, performerId) => {
  const project = await prisma.order.findUnique({
    where: { id: Number(projectId) }
  });
  if (!project || project.orderType !== 'Project' || (tenantId !== null && project.tenantId !== tenantId)) {
    throw new AppError('Project not found', 404);
  }

  const employee = await prisma.employee.findUnique({ where: { userId: performerId } });
  const assignedEmployeeId = employee ? employee.id : 1;

  const missionPayload = {
    orderId: project.id,
    assignedEmployeeId,
    remarks: missionData.remarks || missionData.notes || '',
    missionType: 'LOGISTICS',
    metadata: {
      destination_type: missionData.destination_type || 'Client Site',
      notes: missionData.notes || '',
      project_name: (typeof project.metadata === 'string' ? JSON.parse(project.metadata) : (project.metadata || {})).name || project.orderNumber
    }
  };

  const newMission = await missionRepo.createMission(missionPayload, project.tenantId);

  await logAudit({
    module: 'MISSIONS',
    action: 'CREATE',
    description: `Converted Project ${project.orderNumber} to Mission ${newMission.missionNumber}`,
    newValue: newMission,
    performedBy: performerId
  });

  return newMission;
};

export const convertOrderToMission = async (orderId, missionData, tenantId, performerId) => {
  const order = await prisma.order.findUnique({
    where: { id: Number(orderId) }
  });
  if (!order || (tenantId !== null && order.tenantId !== tenantId)) {
    throw new AppError('Order not found', 404);
  }

  const employee = await prisma.employee.findUnique({ where: { userId: performerId } });
  const assignedEmployeeId = employee ? employee.id : 1;

  const missionPayload = {
    orderId: order.id,
    assignedEmployeeId,
    remarks: missionData.remarks || missionData.notes || '',
    missionType: 'DELIVERY',
    metadata: {
      destination_type: missionData.destination_type || 'Client Site',
      notes: missionData.notes || ''
    }
  };

  const newMission = await missionRepo.createMission(missionPayload, order.tenantId);

  await logAudit({
    module: 'MISSIONS',
    action: 'CREATE',
    description: `Converted Order ${order.orderNumber} to Mission ${newMission.missionNumber}`,
    newValue: newMission,
    performedBy: performerId
  });

  return newMission;
};

export const assignMission = async (id, assignData, tenantId, performerId) => {
  const mission = await missionRepo.findMissionById(id);
  if (!mission || (tenantId !== null && mission.tenantId !== tenantId)) throw new AppError('Mission not found', 404);

  let employee = null;
  if (assignData.driverId) {
    employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { id: Number(assignData.driverId) },
          { userId: Number(assignData.driverId) }
        ]
      }
    });

    // Auto-create employee profile if missing
    if (!employee) {
      const user = await prisma.user.findUnique({ where: { id: Number(assignData.driverId) } });
      if (user && (tenantId === null || user.tenantId === tenantId || user.tenantId === null)) {
        const effectiveTenantId = user.tenantId || mission.tenantId;

        // Find or create default department
        let defaultDept = await prisma.department.findFirst({ where: { tenantId: effectiveTenantId, name: 'Operations' } });
        if (!defaultDept) {
          defaultDept = await prisma.department.create({
            data: { tenantId: effectiveTenantId, name: 'Operations', code: 'OPS-01' }
          });
        }

        // Find or create default designation
        let defaultDesig = await prisma.designation.findFirst({ where: { tenantId: effectiveTenantId, name: 'Field Staff' } });
        if (!defaultDesig) {
          defaultDesig = await prisma.designation.create({
            data: { tenantId: effectiveTenantId, departmentId: defaultDept.id, name: 'Field Staff' }
          });
        }

        employee = await prisma.employee.create({
          data: {
            userId: user.id,
            tenantId: effectiveTenantId,
            firstName: user.name?.split(' ')[0] || 'Unknown',
            lastName: user.name?.split(' ').slice(1).join(' ') || 'User',
            employeeCode: `EMP-${user.id}-${Date.now().toString().slice(-4)}`,
            departmentId: defaultDept.id,
            designationId: defaultDesig.id,
            joiningDate: new Date(),
            status: 'active'
          }
        });
      } else {
        throw new AppError('Employee not found or unauthorized', 404);
      }
    }
  }

  // Update mission
  const updatedMission = await prisma.mission.update({
    where: { id: mission.id },
    data: {
      status: 'assigned',
      assignedEmployeeId: employee ? employee.id : mission.assignedEmployeeId,
      metadata: {
        ...(typeof mission.metadata === 'object' ? mission.metadata : {}),
        vehicleId: assignData.vehicleId || null
      }
    }
  });

  await logAudit({
    module: 'MISSIONS',
    action: 'UPDATE',
    description: `Assigned Mission ${mission.missionNumber} to Driver ID ${assignData.driverId}`,
    performedBy: performerId
  });

  return updatedMission;
};

export const updateMissionStatus = async (id, status, tenantId, performerId) => {
  const mission = await missionRepo.findMissionById(id);
  if (!mission || (tenantId !== null && mission.tenantId !== tenantId)) throw new AppError('Mission not found', 404);

  const newStatus = String(status).toLowerCase();

  if (newStatus === 'in_progress') {
    // If it's not assigned, forcefully assign it to proceed
    if (mission.status === 'pending') {
      await prisma.mission.update({ where: { id: mission.id }, data: { status: 'assigned' } });
    }
    if (mission.status !== 'in_progress') {
      await startMission(id, tenantId, performerId);
    }
    return await missionRepo.findMissionById(id);
  } else if (newStatus === 'en_route') {
    if (mission.status === 'assigned') {
      await startMission(id, tenantId, performerId);
    }
    await prisma.mission.update({ where: { id: mission.id }, data: { status: 'en_route' } });
    if (mission.deliveryId) {
      await prisma.delivery.update({ where: { id: mission.deliveryId }, data: { status: 'en_route' } });
    }
    return await missionRepo.findMissionById(id);
  } else if (newStatus === 'completed' || newStatus === 'delivered') {
    // If not in progress, forcefully put it in progress
    if (mission.status === 'assigned' || mission.status === 'pending') {
      await prisma.mission.update({ where: { id: mission.id }, data: { status: 'in_progress' } });
    }
    await submitPOD(id, { signature: 'System Verified' }, tenantId, performerId);
    return await missionRepo.findMissionById(id);
  } else {
    // Just a basic status update for failed/cancelled
    const updated = await prisma.mission.update({
      where: { id: mission.id },
      data: { status: newStatus }
    });
    return updated;
  }
};

export const deleteMission = async (id, tenantId, performerId) => {
  const mission = await missionRepo.findMissionById(id);
  if (!mission || (tenantId !== null && mission.tenantId !== tenantId)) {
    throw new AppError('Mission not found', 404);
  }

  await missionRepo.deleteMission(mission.id);

  await logAudit({
    module: 'MISSIONS',
    action: 'DELETE',
    description: `Deleted Mission ${mission.missionNumber}`,
    performedBy: performerId
  });

  return true;
};
